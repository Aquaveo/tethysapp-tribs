"""
********************************************************************************
* Name: modify_tribs_scenarios.py
* Author: EJones
* Created On: Oct 5, 2023
* Copyright: (c) Aquaveo 2023
********************************************************************************
"""
import os
import shutil
from unittest import mock
import pytest
from tethysapp.tribs.controllers.scenarios.modify_tribs_scenario import ModifyTribsScenario
from tethysext.atcore.exceptions import ATCoreException


def test_handle_resource_finished_processing_not_editing(
    rf, admin_user, db_session, scenario_with_project_with_fdb, mock_app_user, mocker, test_files, tmp_path
):
    scenario = scenario_with_project_with_fdb
    project = scenario_with_project_with_fdb.project

    # Mocks
    _ = mocker.patch('tethysapp.tribs.controllers.scenarios.modify_tribs_scenario.messages')
    mock_log = mocker.patch('tethysapp.tribs.controllers.scenarios.modify_tribs_scenario.log')
    mock_suw = mocker.patch('tethysapp.tribs.controllers.scenarios.modify_tribs_scenario.ScenarioUploadWorkflow')

    # Mock app.get_<app|user>_workspace methods
    mock_app = mocker.patch('tethysapp.tribs.controllers.scenarios.modify_tribs_scenario.app')
    user_workspace = tmp_path / admin_user.username
    user_workspace.mkdir()
    mock_app.get_user_workspace.return_value = mock.MagicMock(path=str(user_workspace))

    # Mock request
    mock_request = rf.post('/foo/some-id/bar/', data={'select_project': str(project.id)})  # Select the project by id
    mock_request.user = admin_user
    context = {}

    # Setup files
    test_zip = os.path.join(test_files, 'controllers', 'scenarios', 'SALAS.zip')
    shutil.copy(test_zip, str(tmp_path))
    test_file = str(tmp_path / 'SALAS.zip')
    scenario.set_attribute('files', [test_file])
    scenario_input_file = os.path.join(test_files, 'controllers', 'realizations', 'SALAS', 'salas.in')
    scenario.init(scenario.project, 32613, scenario_input_file)
    assert scenario.input_file, scenario_input_file

    mtd_controller = ModifyTribsScenario()
    mtd_controller.handle_resource_finished_processing(
        session=db_session,
        request=mock_request,
        request_app_user=mock_app_user,
        resource=scenario,
        editing=False,
        context=context,
    )

    # ScenarioUploadWorkflow Testing
    mock_suw.assert_called_with(
        user=admin_user,
        workflow_name=scenario.name,
        workspace_path=str(user_workspace / str(scenario.id)),
        input_archive_path=test_file,
        srid=scenario.get_attribute('srid'),
        resource_db_url=mock_app.get_persistent_store_database(),
        resource_id=str(scenario.id),
        resource_type=scenario.type,
        project_id=str(project.id),
        gs_engine=mock_app.get_spatial_dataset_service(),
    )

    mock_suw().run_job.assert_called()
    mock_log.info.assert_called_with("SCENARIO BULK UPLOAD job submitted to HTCondor")


def test_handle_resource_finished_processing_editing(
    rf, db_session, project, scenario_with_project, mock_app_user, mocker, test_files, tmp_path
):
    context = {}
    mock_app = mocker.patch('tethysapp.tribs.controllers.scenarios.modify_tribs_scenario.app')
    mock_app.get_app_workspace.return_value = mock.MagicMock(path=str(tmp_path))
    mocker.patch('tethysapp.tribs.controllers.scenarios.modify_tribs_scenario.log')
    mock_request = rf.post('/foo/some-id/bar/', data={'select_project': str(project.id)})  # Select the project by id

    test_zip = os.path.join(test_files, 'controllers', 'scenarios', 'SALAS.zip')
    shutil.copy(test_zip, str(tmp_path))
    scenario_with_project.set_attribute('files', [str(tmp_path / 'SALAS.zip')])

    mts_controller = ModifyTribsScenario()
    mts_controller.handle_resource_finished_processing(
        session=db_session,
        request=mock_request,
        request_app_user=mock_app_user,
        resource=scenario_with_project,
        editing=True,
        context=context,
    )


def test_handle_resource_finished_processing_no_project(
    mock_session, mock_app_user, mock_resource, mock_request, mocker
):
    context = {}
    mocker.patch('tethysapp.tribs.controllers.scenarios.modify_tribs_scenario.app')
    mocker.patch('tethysapp.tribs.controllers.scenarios.modify_tribs_scenario.log')
    mock_messages = mocker.patch('tethysapp.tribs.controllers.scenarios.modify_tribs_scenario.messages')

    mts_controller = ModifyTribsScenario()
    with pytest.raises(ATCoreException) as exc:
        mts_controller.handle_resource_finished_processing(
            session=mock_session,
            request=mock_request,
            request_app_user=mock_app_user,
            resource=mock_resource,
            editing=False,
            context=context
        )
        assert exc.value.args[0] == f'Could not find the selected project while initializing {mock_resource}.'

    mock_messages.error.assert_called_with(
        mock_request, 'Could not find files in uploaded zip archive while initializing your scenario.'
    )


def test_validate_custom_fields(project, mocker):
    mts_controller = ModifyTribsScenario()
    _ = mocker.patch('tethysapp.tribs.controllers.scenarios.modify_tribs_scenario.app')
    params = {}
    params['project'] = project.id
    _ = mocker.patch('tethysapp.tribs.controllers.scenarios.modify_tribs_scenario.messages')

    mts_controller.validate_custom_fields(params)


def test_initialize_custom_fields(rf, db_session, project, scenario_with_project, mock_app_user, mocker):
    mock_super = mocker.patch('tethysapp.tribs.controllers.scenarios.modify_tribs_scenario.super')
    mock_super.get_sessionmaker.return_value = db_session

    _ = mocker.patch('tethysapp.tribs.controllers.scenarios.modify_tribs_scenario.messages')

    mock_request = rf.post('/foo/some-id/bar/', data={'select_project': str(project.id)})  # Select the project by id
    context = {}

    mts_controller = ModifyTribsScenario()
    mts_controller._AppUser = mock_app_user
    mts_controller.initialize_custom_fields(
        session=db_session, request=mock_request, resource=scenario_with_project, editing=False, context=context
    )


def test_initialize_custom_fields_get_resources(rf, db_session, project, scenario_with_project, mock_app_user, mocker):
    mock_super = mocker.patch('tethysapp.tribs.controllers.scenarios.modify_tribs_scenario.super')
    mock_super.get_sessionmaker.return_value = db_session

    _ = mocker.patch('tethysapp.tribs.controllers.scenarios.modify_tribs_scenario.messages')

    mock_request = rf.post('/foo/some-id/bar/', data={'select_project': str(project.id)})  # Select the project by id
    context = {}

    mock_app_user.get_resources.return_value = [project]

    mts_controller = ModifyTribsScenario()
    mts_controller._AppUser = mock_app_user
    mts_controller._AppUser.get_app_user_from_request.return_value = mock_app_user

    mts_controller.initialize_custom_fields(
        session=db_session, request=mock_request, resource=scenario_with_project, editing=False, context=context
    )


def test_initialize_custom_fields_editing(rf, db_session, project, scenario_with_project, mock_app_user, mocker):
    mock_super = mocker.patch('tethysapp.tribs.controllers.scenarios.modify_tribs_scenario.super')
    mock_super.get_sessionmaker.return_value = db_session

    mock_app_user.get_resources.return_value = [project]

    _ = mocker.patch('tethysapp.tribs.controllers.scenarios.modify_tribs_scenario.messages')

    mock_request = rf.post('/foo/some-id/bar/', data={'select_project': str(project.id)})  # Select the project by id
    context = {}

    mts_controller = ModifyTribsScenario()
    mts_controller._AppUser = mock_app_user
    mts_controller.initialize_custom_fields(
        session=db_session, request=mock_request, resource=scenario_with_project, editing=True, context=context
    )
