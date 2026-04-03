import json
import os
import re
import shutil
from pathlib import Path
from unittest import mock
import warnings
from uuid import uuid4

import pytest
from sqlalchemy import create_engine
from sqlalchemy.exc import InvalidRequestError
from sqlalchemy.orm import Session, object_session

from tethys_dataset_services.engines.geoserver_engine import GeoServerSpatialDatasetEngine
from tethysext.atcore.models.app_users import AppUser

from tribs_adapter.resources import Project, Scenario, Dataset, Realization
from tribs_adapter.workflows import TRIBS_WORKFLOWS
from tethysapp.tribs.models import init_primary_db
from tethysapp.tribs.app import Tribs as app
from ..integrated_tests import TEST_DB_URL


@pytest.fixture(autouse=True)
def use_in_memory_channels_backend(settings):
    settings.CHANNEL_LAYERS['tribs'] = {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    }


@pytest.fixture(scope="function")
def test_files():
    test_files_dir = Path(__file__).resolve().parent.parent / 'files'
    return test_files_dir


@pytest.fixture(scope="module")
def db_url():
    return TEST_DB_URL


@pytest.fixture(scope="module")
def db_connection(db_url):
    """Create a SQLAlchemy engine for the primary database."""
    engine = create_engine(db_url)
    connection = engine.connect()
    transaction = connection.begin()

    # Create ATCore-related tables (e.g.: Resources)
    init_primary_db(connection, first_time=True)

    yield connection

    transaction.rollback()
    connection.close()
    engine.dispose()


@pytest.fixture(scope="module")
def session_maker(db_connection):
    """Create a SQLAlchemy session for the primary database."""
    def session_maker_factory():
        db_connection.begin_nested()
        session = Session(db_connection)
        return session

    return session_maker_factory


@pytest.fixture(scope="function")
def db_session(session_maker):
    """Create a SQLAlchemy session for the primary database."""
    session = session_maker()

    yield session

    session.close()


@pytest.fixture(scope="function")
def staff_app_user(db_session):
    """Get the _staff App User."""
    app_user = db_session.query(AppUser).filter_by(username=AppUser.STAFF_USERNAME).one()
    return app_user


@pytest.fixture(scope="function")
def mock_app_get_ps_db(session_maker, mocker):
    """Create a SQLAlchemy session for the primary database."""
    def mock_app_factory(mock_path):
        mock_app = mocker.patch(mock_path)
        mock_app.get_persistent_store_database.return_value = session_maker
        return mock_app

    return mock_app_factory


@pytest.fixture(scope="function")
def mock_app_get_sds(mocker):
    """Create a mock GeoServer Engine to be returned by app.get_spatial_dataset_service()"""
    def mock_app_sds_factory(mock_path):
        mock_app = mocker.patch(mock_path)
        mock_geoserver = mock.MagicMock(
            spec=GeoServerSpatialDatasetEngine,
            endpoint='http://test.mock:8080/geoserver/rest/',
        )
        mock_geoserver.get_wms_endpoint.return_value = 'http://test.mock:8080/geoserver/wms/'
        mock_app.get_spatial_dataset_service.return_value = mock_geoserver
        return mock_geoserver

    return mock_app_sds_factory


@pytest.fixture(scope="function")
def project(db_session):
    project = Project(name='test_project')
    db_session.add(project)
    db_session.commit()
    yield project
    db_session.delete(project)
    db_session.commit()


@pytest.fixture(scope="function")
def project_with_fdb(db_session, tmp_path):
    with mock.patch.dict('os.environ', {'FDB_ROOT_DIR': str(tmp_path)}, clear=True):
        project = Project.new(
            session=db_session,
            name='Test FDB Project',
            description='Initialized Project with File Database.',
            created_by='_staff',
        )
        yield project
        db_session.delete(project)
        db_session.commit()


@pytest.fixture(scope="function")
def project_with_workflows(project_with_fdb, staff_app_user):
    project = project_with_fdb
    session = object_session(project)
    mock_map_manager = object()
    mock_spatial_manager = object()
    for workflow_type, WorkflowClass in TRIBS_WORKFLOWS.items():
        w = WorkflowClass.new(
            app=app,
            name=f'test_workflow_{workflow_type}',
            description='Test Workflow',
            resource_id=str(project.id),
            creator_id=str(staff_app_user.id),
            geoserver_name="",
            map_manager=mock_map_manager,
            spatial_manager=mock_spatial_manager,
        )
        session.add(w)

    session.commit()
    return project


@pytest.fixture(scope="function")
def scenario_with_project(db_session, project):
    scenario = Scenario(name='test_scenario')
    scenario.project = project
    scenario.srid = 32613
    db_session.add(scenario)
    db_session.commit()
    yield scenario
    db_session.delete(scenario)
    db_session.commit()


@pytest.fixture(scope="function")
def scenario_with_project_with_fdb(db_session, project_with_fdb):
    scenario = Scenario(name='test_scenario')
    scenario.project = project_with_fdb
    scenario.srid = 32613
    db_session.add(scenario)
    db_session.commit()
    yield scenario
    db_session.delete(scenario)
    db_session.commit()


@pytest.fixture(scope="function")
def scenario_with_input_file(db_session, project_with_fdb, test_files):
    input_file = test_files / 'backend' / 'input_files' / 'salas.in'
    scenario = Scenario.new(
        session=db_session,
        name='Input File Scenario',
        description='Salas input file scenario',
        created_by='_staff',
        project=project_with_fdb,
        srid=32613,
        input_file=input_file,
    )
    yield scenario
    db_session.delete(scenario)
    db_session.commit()


@pytest.fixture(scope="function")
def dataset_with_scenario_and_project(db_session, scenario_with_project):
    dataset = Dataset(name='test_dataset')
    dataset.project = scenario_with_project.project
    dataset.add_link(scenario_with_project)
    dataset.dataset_type = Dataset.DatasetTypes.JSON
    db_session.add(dataset)
    db_session.commit()
    yield dataset
    db_session.delete(dataset)
    db_session.commit()


@pytest.fixture(scope="function")
def dataset_with_files(db_session, project_with_fdb, test_files):
    dataset = Dataset.new(
        session=db_session,
        name='Test Dataset',
        description='Initialized Dataset with Files.',
        created_by='_staff',
        project=project_with_fdb,
        dataset_type=Dataset.DatasetTypes.TRIBS_TIN,
        srid=32613,
        items=(test_files / 'backend' / 'datasets' / 'mesh').glob('salas.*'),
    )
    yield dataset
    try:
        db_session.refresh(dataset)
        db_session.delete(dataset)
        db_session.commit()
    except InvalidRequestError as e:
        if 'Could not refresh instance' in str(e):
            pass
        else:
            raise e


@pytest.fixture(scope="function")
def new_dataset(db_session):
    dataset = Dataset(name='test_dataset', description="unassociated dataset")
    db_session.add(dataset)
    db_session.commit()
    yield dataset
    db_session.delete(dataset)
    db_session.commit()


@pytest.fixture(scope="function")
def realization_with_scenario_and_project(db_session, scenario_with_project, test_files):
    root_file = os.path.join(test_files, 'controllers', 'conftest', 'SALAS')
    input_file = os.path.join(root_file, 'tRIBS.in')
    scenario_with_project.init(project=scenario_with_project.project, srid=32613, input_file=input_file)
    realization = Realization.new(
        session=db_session,
        name='test_realization',
        description='test realization',
        created_by='test',
        scenario=scenario_with_project,
        model_root=root_file
    )
    db_session.commit()
    yield realization
    try:
        db_session.refresh(realization)
        db_session.delete(realization)
        db_session.commit()
    except InvalidRequestError as e:
        if 'Could not refresh instance' in str(e):
            pass
        else:
            raise e


@pytest.fixture(scope="function")
def complete_project(project_with_fdb, test_files, tmp_path):
    project = project_with_fdb
    session = object_session(project)
    model_root = test_files / 'models' / 'salas'
    input_file_path = model_root / 'salas.in'
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", category=UserWarning)
        # Add a scenario with real model input
        scenario = Scenario.new(
            session=session,
            name='Test Salas',
            description='Fully populated scenario for testing.',
            created_by='_staff',
            project=project,
            srid=32613,
            input_file=input_file_path,
        )

        # Add files attribute to simulate uploaded files
        scenario_upload_files = tmp_path / str(uuid4())
        scenario_upload_files.mkdir()
        scenario_upload_files = scenario_upload_files / 'salas.in'
        shutil.copy(input_file_path, scenario_upload_files)
        scenario.set_attribute('files', [str(scenario_upload_files)])

        # Add a realization with real model results
        realization = Realization.new(
            session=session,
            name='Tests Salas Run 10-20-30',
            description='Results from run of Salas scenario.',
            created_by='_staff',
            scenario=scenario,
            model_root=model_root,
        )

        # Add files attribute to simulate uploaded files
        realization_upload_files = tmp_path / str(uuid4())
        realization_upload_files.mkdir()
        realization_upload_files = realization_upload_files / 'salas.in'
        shutil.copy(input_file_path, realization_upload_files)
        realization.set_attribute('files', [str(realization_upload_files)])

        # Add files attribute to a dataset to simulate direct upload of dataset files
        dataset = scenario.linked_datasets[0]
        dataset_file = test_files / 'controllers' / 'datasets' / 'p0531200418.txt'
        dataset_upload_files = tmp_path / str(uuid4())
        dataset_upload_files.mkdir()
        dataset_upload_files = dataset_upload_files / 'p0531200418.txt'
        shutil.copy(dataset_file, dataset_upload_files)
        dataset.set_attribute('files', [str(dataset_upload_files)])
    return project


@pytest.fixture(scope="function")
def complete_project_workflow(complete_project, staff_app_user):
    project = complete_project
    session = object_session(project)
    # Add a workflow to the project
    from tribs_adapter.workflows import BulkDataRetrievalWorkflow
    workflow = BulkDataRetrievalWorkflow.new(
        app=app,
        name='Test Bulk Data Retrieval',
        resource_id=str(project.id),
        creator_id=str(staff_app_user.id),
        geoserver_name=app.GEOSERVER_NAME,
        map_manager=object(),
        spatial_manager=object(),
    )
    project.workflows.append(workflow)
    session.commit()
    return project


@pytest.fixture(scope="function")
def mock_session():
    return mock.MagicMock()


@pytest.fixture(scope="function")
def mock_request():
    return mock.MagicMock()


@pytest.fixture(scope="function")
def mock_app_user():
    return mock.MagicMock()


@pytest.fixture(scope="function")
def mock_resource():
    return mock.MagicMock()


class TribsTestUtils:
    def is_uuid4(self, s):
        regex = r'^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\Z'
        match = re.fullmatch(regex, s)
        return bool(match)

    def expected_payload(self, resource, from_action=None):
        expected_payload = json.loads(resource.serialize(format='json'))
        if from_action:
            expected_payload['attributes']['fromAction'] = from_action
        return expected_payload

    async def a_expected_payload(self, a_session, resource, from_action=None):
        def _sync(session, resource, from_action):
            return self.expected_payload(resource, from_action=from_action)

        return await a_session.run_sync(_sync, resource, from_action=from_action)

    async def a_get_realizations(self, a_session, project):
        def _sync(session, project):
            return project.scenarios[0].realizations

        return await a_session.run_sync(_sync, project)

    async def a_get_scenarios(self, a_session, project):
        def _sync(session, project):
            return project.scenarios

        return await a_session.run_sync(_sync, project)

    async def a_get_datasets(self, a_session, project):
        def _sync(session, project):
            return project.datasets

        return await a_session.run_sync(_sync, project)

    async def a_get_workflows(self, a_session, project):
        def _sync(session, project):
            return project.workflows

        return await a_session.run_sync(_sync, project)

    async def a_get_linked_datasets(self, a_session, scenario):
        def _sync(session, scenario):
            return scenario.linked_datasets

        return await a_session.run_sync(_sync, scenario)


@pytest.fixture(scope="function")
def tribsutils():
    return TribsTestUtils()
