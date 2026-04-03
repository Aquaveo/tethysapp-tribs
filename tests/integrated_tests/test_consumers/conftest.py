from contextlib import asynccontextmanager
from unittest import mock
from uuid import uuid4
import warnings
import shutil

import aioshutil
import pytest
import pytest_asyncio
from aiopath import AsyncPath
from django.urls import path
from channels.db import database_sync_to_async
from channels.testing import WebsocketCommunicator
from channels.routing import URLRouter
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy import select
from sqlalchemy.exc import InvalidRequestError
from sqlalchemy.orm import sessionmaker

from tethysapp.tribs.app import Tribs as app
from tethysext.atcore.models.app_users import AppUser, AppUsersBase
from tribs_adapter.resources import Project, Dataset, Scenario, Realization
from tethysapp.tribs.consumers.backend import BackendConsumer
from tethysapp.tribs.consumers.handlers.resource_backend_handler import ResourceBackendHandler


@pytest_asyncio.fixture
@pytest.mark.django_db(transaction=True)
async def a_admin_user(django_user_model):
    _async_create_user = database_sync_to_async(django_user_model.objects.create_user)
    admin_user = await _async_create_user(username='admin', password='password')
    yield admin_user
    await database_sync_to_async(admin_user.delete)()


@pytest_asyncio.fixture
async def make_communicator(a_admin_user, django_user_model, mock_backend_app_get_ps_db):
    @asynccontextmanager
    async def make(project_id, connect=True, user=False):
        try:
            application = URLRouter([
                path("apps/tribs/project/<resource_id>/editor/ws/", BackendConsumer.as_asgi()),
            ])
            communicator = WebsocketCommunicator(application, f"/apps/tribs/project/{str(project_id)}/editor/ws/")
            if connect:
                connected, _ = await communicator.connect()
                assert connected
            if user:
                if isinstance(user, bool) or user == "admin":
                    communicator.scope["user"] = a_admin_user
                elif isinstance(user, str):
                    _async_create_user = database_sync_to_async(django_user_model.objects.create_user)
                    not_admin_user = await _async_create_user(username=user, password="password")
                    communicator.scope["user"] = not_admin_user

            yield communicator
        finally:
            await communicator.disconnect()

    return make


@pytest_asyncio.fixture(scope="function")
def a_db_url(db_url):
    db_url = str(db_url).replace('postgresql', 'postgresql+asyncpg')
    return db_url


@pytest_asyncio.fixture(scope="function")
async def a_db_engine(a_db_url):
    """Create a SQLAlchemy engine for the primary database."""
    a_engine = create_async_engine(a_db_url)
    async with a_engine.begin() as conn:
        await conn.run_sync(AppUsersBase.metadata.drop_all)
        await conn.run_sync(AppUsersBase.metadata.create_all)

    a_sm = sessionmaker(a_engine, expire_on_commit=False, class_=AsyncSession)
    async with a_sm() as session:
        res = await session.execute(select(AppUser).where(AppUser.username == AppUser.STAFF_USERNAME))
        users = res.scalars().all()
        if len(users) == 0:
            new_user = AppUser(username=AppUser.STAFF_USERNAME, role=AppUser.ROLES.DEVELOPER)
            session.add(new_user)
            await session.commit()

    yield a_engine
    await a_engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def a_session_maker(a_db_engine):
    a_sm = sessionmaker(a_db_engine, expire_on_commit=False, class_=AsyncSession)
    return a_sm


@pytest_asyncio.fixture(scope="function")
async def a_session(a_session_maker):
    async with a_session_maker() as s:
        yield s


@pytest_asyncio.fixture
async def mock_backend_app_get_ps_db(db_url, mocker):
    mock_app = mocker.patch('tethysapp.tribs.consumers.backend.app')
    # IMPORTANT: The BackendConsumer translates the normal database URL to an async URL
    mock_app.get_persistent_store_database.return_value = db_url
    return mock_app


@pytest_asyncio.fixture
async def mock_fdb_root_directory(mocker, tmp_path):
    mock_fdb_dir = mocker.patch(
        'tribs_adapter.resources.Project.fdb_root_directory', new_callable=mocker.PropertyMock, return_value=tmp_path
    )
    return mock_fdb_dir


@pytest_asyncio.fixture
async def a_staff_app_user(a_session):
    """Get the _staff_user App User."""
    def _get_app_user(session):
        return session.query(AppUser).filter_by(username=AppUser.STAFF_USERNAME).one()

    app_user = await a_session.run_sync(_get_app_user)
    return app_user


@pytest_asyncio.fixture
async def mock_get_uploads_dir(mocker, tmp_path):
    async def _get_uploads_dir_factory(project_id, action_id, files):
        # Make action_id dir to simulate files uploaded previously by file upload handler
        a_tmp_path = AsyncPath(tmp_path)
        uploads_dir = a_tmp_path / 'uploads' / str(project_id)
        action_uploads_dir = uploads_dir / str(action_id)
        await action_uploads_dir.mkdir(parents=True, exist_ok=True)
        # Add test files to the uploads directory
        for f in files:
            await aioshutil.copy(f, action_uploads_dir)

        # Mock get_app_workspace to return the temp app workspace: where the app uploads directories should be
        mocker.patch(
            'tethysapp.tribs.consumers.handlers.resource_backend_handler.app.get_app_workspace',
            return_value=mock.AsyncMock(path=a_tmp_path)
        )
        return uploads_dir

    return _get_uploads_dir_factory


@pytest_asyncio.fixture
async def mock_get_spatial_manager(mocker):
    mocker.patch(
        'tethysapp.tribs.consumers.handlers.resource_backend_handler.app.get_spatial_dataset_service',
        return_value=mock.MagicMock(
            get_wms_endpoint=mock.MagicMock(return_value='http://test.mock:8080/geoserver/wms/')
        )
    )
    mock_sm = mocker.patch(
        'tethysapp.tribs.consumers.handlers.resource_backend_handler.TribsSpatialManager.get_extent_for_dataset',
        return_value=[-107.0, 38.0, -106.0, 39.0]
    )
    return mock_sm


def _make_project(
    session,
    test_files,
    tmp_path,
    a_staff_app_user,
    with_scenario=True,
    with_input_file=True,
    with_dataset=True,
    with_realization=True,
    with_workflow=True
):
    # Project with a FDB
    project = Project.new(
        session=session,
        name='Test FDB Project',
        description='Initialized Project with File Database.',
        created_by='_staff_user',
    )

    model_root = test_files / 'models' / 'salas'
    input_file_path = model_root / 'salas.in'

    with warnings.catch_warnings():
        warnings.simplefilter("ignore", category=UserWarning)
        if with_scenario:
            # Add a scenario with real model input
            scenario = Scenario.new(
                session=session,
                name='Test Salas',
                description='A scenario for testing.',
                created_by='_staff_user',
                project=project,
                srid=32613,
                input_file=input_file_path if with_input_file else None,
            )

            # Add files attribute to simulate uploaded files
            if with_input_file:
                scenario_upload_files = tmp_path / str(uuid4())
                scenario_upload_files.mkdir()
                scenario_upload_files = scenario_upload_files / 'salas.in'
                shutil.copy(input_file_path, scenario_upload_files)
                scenario.set_attribute('files', [str(scenario_upload_files)])

        if with_realization:
            # Add a realization with real model results
            realization = Realization.new(
                session=session,
                name='Tests Salas Run 10-20-30',
                description='Results from run of Salas scenario.',
                created_by='_staff_user',
                scenario=scenario,
                model_root=model_root,
            )

            # Add files attribute to simulate uploaded files
            realization_upload_files = tmp_path / str(uuid4())
            realization_upload_files.mkdir()
            realization_upload_files = realization_upload_files / 'salas.in'
            shutil.copy(input_file_path, realization_upload_files)
            realization.set_attribute('files', [str(realization_upload_files)])

        if with_dataset:
            # Add files attribute to a dataset to simulate direct upload of dataset files
            dataset = scenario.linked_datasets[0]
            dataset_file = test_files / 'controllers' / 'datasets' / 'p0531200418.txt'
            dataset_upload_files = tmp_path / str(uuid4())
            dataset_upload_files.mkdir()
            dataset_upload_files = dataset_upload_files / 'p0531200418.txt'
            shutil.copy(dataset_file, dataset_upload_files)
            dataset.set_attribute('files', [str(dataset_upload_files)])

        if with_workflow:
            # Add a workflow to the project
            from tribs_adapter.workflows import BulkDataRetrievalWorkflow
            workflow = BulkDataRetrievalWorkflow.new(
                app=app,
                name='Test Bulk Data Retrieval',
                resource_id=str(project.id),
                creator_id=str(a_staff_app_user.id),
                geoserver_name=app.GEOSERVER_NAME,
                map_manager=object(),
                spatial_manager=object(),
            )
            project.workflows.append(workflow)

        session.commit()
    return project


@pytest_asyncio.fixture
async def a_empty_project(a_session, a_staff_app_user, test_files, tmp_path, mock_fdb_root_directory):
    project = await a_session.run_sync(
        _make_project,
        test_files=test_files,
        tmp_path=tmp_path,
        a_staff_app_user=a_staff_app_user,
        with_scenario=False,
        with_input_file=False,
        with_dataset=False,
        with_realization=False,
        with_workflow=False
    )
    assert project.fdb_root_directory == tmp_path
    yield project
    await a_session.delete(project)
    await a_session.commit()


@pytest_asyncio.fixture
async def a_complete_project(a_session, a_staff_app_user, test_files, tmp_path, mock_fdb_root_directory):
    project = await a_session.run_sync(
        _make_project,
        test_files=test_files,
        tmp_path=tmp_path,
        a_staff_app_user=a_staff_app_user,
        with_scenario=True,
        with_input_file=True,
        with_dataset=True,
        with_realization=True,
        with_workflow=True
    )
    assert project.fdb_root_directory == tmp_path
    yield project
    await a_session.delete(project)
    await a_session.commit()


@pytest_asyncio.fixture
async def a_project_with_scenario(a_session, a_staff_app_user, test_files, tmp_path, mock_fdb_root_directory):
    project = await a_session.run_sync(
        _make_project,
        test_files=test_files,
        tmp_path=tmp_path,
        a_staff_app_user=a_staff_app_user,
        with_scenario=True,
        with_input_file=False,
        with_dataset=False,
        with_realization=False,
        with_workflow=False
    )
    assert project.fdb_root_directory == tmp_path
    yield project
    await a_session.delete(project)
    await a_session.commit()


@pytest_asyncio.fixture
async def a_project_with_scenario_with_input_file(
    a_session, a_staff_app_user, test_files, tmp_path, mock_fdb_root_directory
):
    project = await a_session.run_sync(
        _make_project,
        test_files=test_files,
        tmp_path=tmp_path,
        a_staff_app_user=a_staff_app_user,
        with_scenario=True,
        with_input_file=False,
        with_dataset=False,
        with_realization=False,
        with_workflow=False
    )
    assert project.fdb_root_directory == tmp_path
    yield project
    await a_session.delete(project)
    await a_session.commit()


@pytest_asyncio.fixture
async def a_dataset_with_files(a_session, a_empty_project, test_files):
    def _new_dataset(session, project):
        dataset = Dataset.new(
            session=session,
            name='Test Dataset',
            description='Initialized Dataset with Files.',
            created_by='_staff',
            project=project,
            dataset_type=Dataset.DatasetTypes.TRIBS_TIN,
            srid=32613,
            items=(test_files / 'backend' / 'datasets' / 'mesh').glob('salas.*'),
        )
        return dataset

    dataset = await a_session.run_sync(_new_dataset, a_empty_project)
    yield dataset
    try:
        await a_session.refresh(dataset)
        await a_session.delete(dataset)
        await a_session.commit()
    except InvalidRequestError as e:
        if 'Could not refresh instance' in str(e):
            pass
        else:
            raise e


@pytest_asyncio.fixture
async def a_pixel_dataset_with_files(a_session, a_empty_project, test_files):
    def _sync(session, project, test_files):
        dataset = Dataset.new(
            session=session,
            name='Test Pixel Dataset',
            description='Initialized Pixel Dataset with Files.',
            created_by='_staff',
            project=project,
            dataset_type=Dataset.DatasetTypes.TRIBS_OUT_PIXEL,
            srid=32612,
            items=(test_files / 'backend' / 'datasets' / 'pixel').glob('*.pixel'),
        )
        return dataset

    dataset = await a_session.run_sync(_sync, a_empty_project, test_files)
    yield dataset
    try:
        await a_session.refresh(dataset)
        await a_session.delete(dataset)
        await a_session.commit()
    except InvalidRequestError as e:
        if 'Could not refresh instance' in str(e):
            pass
        else:
            raise e


@pytest_asyncio.fixture
async def rbh(a_complete_project, a_session_maker, a_staff_app_user):
    """Create a ResourceBackendHandler with a complete project."""
    project = a_complete_project
    backend = mock.AsyncMock(
        sessionmaker=a_session_maker,
        project_id=str(project.id),
        scope={
            'user': mock.MagicMock(username=a_staff_app_user.username, is_anonymous=False),
            'url_route': {
                'kwargs': {
                    'resource_id': str(project.id),
                }
            }
        }
    )

    rbh = ResourceBackendHandler(backend)

    return rbh
