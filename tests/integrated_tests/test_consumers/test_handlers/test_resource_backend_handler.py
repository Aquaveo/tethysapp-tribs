from unittest import mock

from aiopath import AsyncPath
from pydantic import ValidationError
import pytest

from tethysext.atcore.models.app_users import ResourceWorkflow, AppUser
from tribs_adapter.resources import Project, Dataset, Scenario, Realization
from tribs_adapter.services.tribs_spatial_manager import TribsSpatialManager
from tethysapp.tribs.consumers.backend_actions import BackendActions
from tethysapp.tribs.consumers.handlers.resource_backend_handler import ResourceBackendHandler


@pytest.mark.asyncio
async def test_receiving_actions_not_implemented(rbh):
    with pytest.raises(NotImplementedError):
        rbh.receiving_actions()


@pytest.mark.asyncio
async def test_action_handler(rbh):
    mock_method = mock.AsyncMock()
    mock_event = {}
    mock_action = {'id': '1234', 'type': BackendActions.DATASET_DATA}
    mock_data = {'id': '4567'}
    wrapped = ResourceBackendHandler.action_handler(mock_method)
    await wrapped(rbh, mock_event, mock_action, mock_data)
    assert await mock_method.called_once_with(rbh, mock_event, mock_action, mock_data)


@pytest.mark.asyncio
async def test_action_handler_validation_error(rbh, mocker):
    mocker.patch('tethysapp.tribs.consumers.handlers.resource_backend_handler.log')
    rbh.send_error = mock.AsyncMock()
    validation_error = ValidationError.from_exception_data("test validation error", line_errors=[])
    mock_method = mock.AsyncMock(side_effect=validation_error)
    mock_event = {}
    mock_action = {'id': '1234', 'type': BackendActions.DATASET_DATA}
    mock_data = {'id': '4567'}
    wrapped = ResourceBackendHandler.action_handler(mock_method)
    await wrapped(rbh, mock_event, mock_action, mock_data)
    assert await mock_method.called_once_with(rbh, mock_event, mock_action, mock_data)
    assert await rbh.send_error.called_once_with(
        f'Validation error occurred while handling {mock_action.get("type")} action "{mock_action.get("id")}".',
        mock_action, mock_data, validation_error.errors()
    )


@pytest.mark.asyncio
async def test_action_handler_value_error(rbh, mocker):
    mocker.patch('tethysapp.tribs.consumers.handlers.resource_backend_handler.log')
    rbh.send_error = mock.AsyncMock()
    mock_method = mock.AsyncMock(side_effect=ValueError("test value error"))
    mock_event = {}
    mock_action = {'id': '1234', 'type': BackendActions.DATASET_DATA}
    mock_data = {'id': '4567'}
    wrapped = ResourceBackendHandler.action_handler(mock_method)
    await wrapped(rbh, mock_event, mock_action, mock_data)
    assert await mock_method.called_once_with(rbh, mock_event, mock_action, mock_data)
    assert await rbh.send_error.called_once_with('test value error', mock_action, mock_data)


@pytest.mark.asyncio
async def test_action_handler_unexpected_error(rbh, mocker):
    mock_log = mocker.patch('tethysapp.tribs.consumers.handlers.resource_backend_handler.log')
    rbh.send_error = mock.AsyncMock()
    mock_method = mock.AsyncMock(side_effect=Exception("test unexpected error"))
    mock_event = {}
    mock_action = {'id': '1234', 'type': BackendActions.DATASET_DATA}
    mock_data = {'id': '4567'}
    wrapped = ResourceBackendHandler.action_handler(mock_method)
    await wrapped(rbh, mock_event, mock_action, mock_data)
    assert await mock_method.called_once_with(rbh, mock_event, mock_action, mock_data)
    assert await rbh.send_error.called_once_with('test unexpected error', mock_action, mock_data)
    assert mock_log.exception.called_with(f'An unexpected error occurred while handling action: {mock_action}')


@pytest.mark.asyncio
async def test__get_request(rbh):
    ret = rbh._get_request()
    assert ret.user.username == '_staff_user'


@pytest.mark.asyncio
async def test_make_unique_dataset(rbh, a_complete_project, a_session):
    project = a_complete_project

    def _data(session):
        dataset = project.datasets[0]
        return dataset

    dataset = await a_session.run_sync(_data)
    new_name = dataset.name  # Same name as existing dataset
    ret = await rbh.make_unique(new_name, Dataset, project)
    assert ret == f"{dataset.name} (1)"


@pytest.mark.asyncio
async def test_make_unique_dataset_already_unique(rbh, a_complete_project, a_session):
    project = a_complete_project

    def _data(session):
        dataset = project.datasets[0]
        return dataset

    dataset = await a_session.run_sync(_data)
    new_name = dataset.name + "Unique"  # this one is unique
    ret = await rbh.make_unique(new_name, Dataset, project)
    assert ret == new_name


@pytest.mark.asyncio
async def test_make_unique_scenario(rbh, a_complete_project, a_session):
    project = a_complete_project

    def _data(session):
        scenario = project.scenarios[0]
        return scenario

    scenario = await a_session.run_sync(_data)
    new_name = scenario.name  # Same name as existing scenario
    ret = await rbh.make_unique(new_name, Scenario, project)
    assert ret == f"{scenario.name} (1)"


@pytest.mark.skip
@pytest.mark.asyncio
async def test_make_unique_realization(rbh, a_complete_project, a_session):
    project = a_complete_project

    def _data(session):
        scenario = project.scenarios[0]
        realization = scenario.realizations[0]
        return realization

    realization = await a_session.run_sync(_data)
    new_name = realization.name  # Same name as existing realization
    ret = await rbh.make_unique(new_name, Realization, project)
    assert ret == f"{realization.name} (1)"


@pytest.mark.asyncio
async def test_make_unique_workflow(rbh, a_complete_project, a_session):
    project = a_complete_project

    def _data(session):
        workflow = project.workflows[0]
        return workflow

    workflow = await a_session.run_sync(_data)
    new_name = workflow.name  # Same name as existing workflow
    ret = await rbh.make_unique(new_name, ResourceWorkflow, project)
    assert ret == f"{workflow.name} (1)"


@pytest.mark.asyncio
async def test_get_app_user(rbh, a_session):
    ret = await rbh.get_app_user(a_session)
    assert isinstance(ret, AppUser)
    assert ret.username == '_staff_user'


@pytest.mark.asyncio
async def test_get_project_id(rbh, a_complete_project):
    project = a_complete_project
    ret = rbh.get_project_id()
    assert ret == str(project.id)


@pytest.mark.asyncio
async def test_get_project(rbh, a_complete_project, a_session):
    project = a_complete_project
    ret = await rbh.get_project(a_session)
    assert isinstance(ret, Project)
    assert ret.id == project.id
    assert ret == project


@pytest.mark.asyncio
async def test_get_project_dne(rbh, a_session):
    dne_project_id = '00000000-0000-0000-0000-000000000000'
    # Override the project id in the URL
    rbh.backend_consumer.project_id = dne_project_id
    rbh.backend_consumer.scope["url_route"]["kwargs"]["resource_id"] = dne_project_id
    with pytest.raises(ValueError) as exc:
        await rbh.get_project(a_session)
    assert str(exc.value) == f'Could not find Project with ID "{dne_project_id}"'


@pytest.mark.asyncio
async def test_get_scenario(rbh, a_complete_project, a_session):
    project = a_complete_project

    def _data(session):
        scenario = project.scenarios[0]
        return scenario

    scenario = await a_session.run_sync(_data)
    ret = await rbh.get_scenario(a_session, scenario.id)
    assert isinstance(ret, Scenario)
    assert ret.id == scenario.id
    assert ret == scenario


@pytest.mark.asyncio
async def test_get_scenario_dne(rbh, a_session):
    dne_scenario_id = '00000000-0000-0000-0000-000000000000'
    with pytest.raises(ValueError) as exc:
        await rbh.get_scenario(a_session, dne_scenario_id)
    assert str(exc.value) == f'Could not find Scenario with ID "{dne_scenario_id}"'


@pytest.mark.asyncio
async def test_get_realization(rbh, a_complete_project, a_session):
    project = a_complete_project

    def _data(session):
        scenario = project.scenarios[0]
        realization = scenario.realizations[0]
        return realization

    realization = await a_session.run_sync(_data)
    ret = await rbh.get_realization(a_session, realization.id)
    assert isinstance(ret, Realization)
    assert ret.id == realization.id
    assert ret == realization


@pytest.mark.asyncio
async def test_get_realization_dne(rbh, a_session):
    dne_realization_id = '00000000-0000-0000-0000-000000000000'
    with pytest.raises(ValueError) as exc:
        await rbh.get_realization(a_session, dne_realization_id)
    assert str(exc.value) == f'Could not find Realization with ID "{dne_realization_id}"'


@pytest.mark.asyncio
async def test_get_dataset(rbh, a_complete_project, a_session):
    project = a_complete_project

    def _data(session):
        dataset = project.datasets[0]
        return dataset

    dataset = await a_session.run_sync(_data)
    ret = await rbh.get_dataset(a_session, dataset.id)
    assert isinstance(ret, Dataset)
    assert ret.id == dataset.id
    assert ret == dataset


@pytest.mark.asyncio
async def test_get_dataset_dne(rbh, a_session):
    dne_dataset_id = '00000000-0000-0000-0000-000000000000'
    with pytest.raises(ValueError) as exc:
        await rbh.get_dataset(a_session, dne_dataset_id)
    assert str(exc.value) == f'Could not find Dataset with ID "{dne_dataset_id}"'


@pytest.mark.asyncio
async def test_get_workflow(rbh, a_complete_project, a_session):
    project = a_complete_project

    def _data(session):
        workflow = project.workflows[0]
        return workflow

    workflow = await a_session.run_sync(_data)
    ret = await rbh.get_workflow(a_session, workflow.id)
    assert isinstance(ret, ResourceWorkflow)
    assert ret.id == workflow.id
    assert ret == workflow


@pytest.mark.asyncio
async def test_get_workflow_dne(rbh, a_session):
    dne_workflow_id = '00000000-0000-0000-0000-000000000000'
    with pytest.raises(ValueError) as exc:
        await rbh.get_workflow(a_session, dne_workflow_id)
    assert str(exc.value) == f'Could not find Workflow with ID "{dne_workflow_id}"'


@pytest.mark.asyncio
async def test_get_uploads_dir(rbh, a_complete_project, tmp_path, mocker):
    mocker.patch(
        'tethysapp.tribs.consumers.handlers.resource_backend_handler.app.get_app_workspace',
        return_value=mock.MagicMock(path=str(tmp_path))
    )
    mocker.patch('tethysapp.tribs.consumers.handlers.resource_backend_handler.log')

    ret = await rbh.get_uploads_dir()
    assert ret == AsyncPath(tmp_path) / 'uploads' / str(a_complete_project.id)
    assert await ret.exists()


@pytest.mark.asyncio
async def test_get_spatial_manager(rbh, a_complete_project, mocker):
    mock_gsds = mocker.patch(
        'tethysapp.tribs.consumers.handlers.resource_backend_handler.app.get_spatial_dataset_service'
    )
    ret = await rbh.get_spatial_manager()
    assert isinstance(ret, TribsSpatialManager)
    assert ret.gs_engine == mock_gsds.return_value
    assert mock_gsds.called_once_with('geoserver', as_engine=True)


@pytest.mark.asyncio
async def test_send_data(rbh, a_complete_project, tribsutils, a_session):
    rbh.SEND_DATA_ACTION = BackendActions.DATASET_DATA  # Normally implemented by handler subclass
    action_id = "1234"

    def _data(session):
        dataset = a_complete_project.datasets[0]
        return dataset

    dataset = await a_session.run_sync(_data)
    await rbh.send_data(a_session, dataset, action_id)
    assert await rbh.backend_consumer.send_data.called_once_with(
        BackendActions.DATASET_DATA, await tribsutils.a_expected_payload(a_session, dataset, from_action=action_id)
    )


@pytest.mark.asyncio
async def test_send_data_send_data_not_implemented(rbh, mocker, a_session):
    mock_log = mocker.patch('tethysapp.tribs.consumers.handlers.resource_backend_handler.log')
    with pytest.raises(NotImplementedError) as exc:
        await rbh.send_data(a_session, None, "1234")
    assert str(exc.value) == "The send_data_action property must be implemented by the subclass."
    assert mock_log.error.called_once_with(f'No SEND_DATA_ACTION defined for "{rbh.__class__.__name__}"')


@pytest.mark.asyncio
async def test_send_action(rbh):
    await rbh.send_action(BackendActions.DATASET_CREATE, {"id": "1234"})
    assert await rbh.backend_consumer.send_action.called_once_with(BackendActions.DATASET_CREATE, "1234")


@pytest.mark.asyncio
async def test_send_acknowledge(rbh):
    await rbh.send_acknowledge("some message", BackendActions.DATASET_CREATE, {"id": "1234"}, {"foo": "bar"})
    assert await rbh.backend_consumer.send_acknowledge.called_once_with(
        "some message", BackendActions.DATASET_CREATE, {"id": "1234"}, {"foo": "bar"}
    )


@pytest.mark.asyncio
async def test_send_error(rbh):
    await rbh.send_error(
        "some message", {"action": {
            "type": BackendActions.DATASET_CREATE,
            "id": "4567"
        }}, {"id": "1234"}, {"foo": "bar"}
    )
    assert await rbh.backend_consumer.send_error.called_once_with(
        "some message", {"action": {
            "type": BackendActions.DATASET_CREATE,
            "id": "4567"
        }}, {"id": "1234"}, {"foo": "bar"}
    )
