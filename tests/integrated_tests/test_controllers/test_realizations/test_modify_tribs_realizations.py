"""
********************************************************************************
* Name: modify_tribs_realization.py
* Author: EJones
* Created On: Oct 5, 2023
* Copyright: (c) Aquaveo 2023
********************************************************************************
"""
import os
import shutil
from unittest import mock
import pytest
from tethysapp.tribs.controllers.realizations.modify_tribs_realization import ModifyTribsRealization
from tethysext.atcore.exceptions import ATCoreException
from tribs_adapter.resources.realization import Realization


def test_handle_resource_finished_processing_not_editing(
    rf, admin_user, db_session, scenario_with_project_with_fdb, mock_app_user, mocker, test_files, tmp_path
):
    scenario = scenario_with_project_with_fdb
    project = scenario_with_project_with_fdb.project

    # Mocks
    _ = mocker.patch('tethysapp.tribs.controllers.realizations.modify_tribs_realization.messages')
    mock_log = mocker.patch('tethysapp.tribs.controllers.realizations.modify_tribs_realization.log')
    mock_ruw = mocker.patch(
        'tethysapp.tribs.controllers.realizations.modify_tribs_realization.RealizationUploadWorkflow'
    )

    # Mock app.get_<app|user>_workspace methods
    mock_app = mocker.patch('tethysapp.tribs.controllers.realizations.modify_tribs_realization.app')
    user_workspace = tmp_path / admin_user.username
    user_workspace.mkdir()
    mock_app.get_user_workspace.return_value = mock.MagicMock(path=str(user_workspace))

    # Mock request
    mock_request = rf.post(
        '/foo/some-id/bar/', data={
            'select_project': str(project.id),
            'select_scenario': str(scenario.id),
        }
    )
    mock_request.user = admin_user
    context = {}

    # Setup new realization and files
    new_realization = Realization(
        name='test_realization',
        description='test realization',
        created_by='test',
    )
    db_session.add(new_realization)
    db_session.commit()

    test_zip = os.path.join(test_files, 'controllers', 'scenarios', 'SALAS.zip')
    shutil.copy(test_zip, str(tmp_path))
    test_file = str(tmp_path / 'SALAS.zip')
    new_realization.set_attribute('files', [test_file])
    scenario_input_file = os.path.join(test_files, 'controllers', 'realizations', 'SALAS', 'salas.in')
    scenario.init(scenario.project, 32613, scenario_input_file)
    assert scenario.input_file, scenario_input_file

    mtd_controller = ModifyTribsRealization()
    mtd_controller.handle_resource_finished_processing(
        session=db_session,
        request=mock_request,
        request_app_user=mock_app_user,
        resource=new_realization,
        editing=False,
        context=context,
    )

    assert new_realization.get_attribute('srid') == scenario.get_attribute('srid')

    # RealizationUploadWorkflow Testing
    mock_ruw.assert_called_with(
        user=admin_user,
        workflow_name=new_realization.name,
        workspace_path=str(user_workspace / str(new_realization.id)),
        input_archive_path=test_file,
        srid=scenario.get_attribute('srid'),
        resource_db_url=mock_app.get_persistent_store_database(),
        resource_id=str(new_realization.id),
        resource_type=new_realization.type,
        project_id=str(project.id),
        scenario_id=str(scenario.id),
        gs_engine=mock_app.get_spatial_dataset_service(),
    )

    mock_ruw().run_job.assert_called()
    mock_log.info.assert_called_with("REALIZATION BULK UPLOAD job submitted to HTCondor")


def test_handle_resource_finished_processing_no_project(
    rf, admin_user, db_session, scenario_with_project, realization_with_scenario_and_project, mock_app_user, mocker,
    test_files, tmp_path
):
    context = {}
    mock_app = mocker.patch('tethysapp.tribs.controllers.realizations.modify_tribs_realization.app')
    mock_app.get_app_workspace.return_value = mock.MagicMock(path=str(tmp_path))
    mocker.patch('tethysapp.tribs.controllers.realizations.modify_tribs_realization.log')
    mock_request = rf.post('/foo/some-id/bar/', data={
        'select_scenario': str(scenario_with_project.id),
    })
    mock_request.user = admin_user

    mock_messages = mocker.patch('tethysapp.tribs.controllers.realizations.modify_tribs_realization.messages')

    test_zip = os.path.join(test_files, 'controllers', 'realizations', 'p0531200418.zip')
    shutil.copy(test_zip, str(tmp_path))
    realization_with_scenario_and_project.set_attribute('files', [str(tmp_path / 'p0531200418.zip')])

    mtd_controller = ModifyTribsRealization()
    with pytest.raises(ATCoreException) as exc:
        mtd_controller.handle_resource_finished_processing(
            session=db_session,
            request=mock_request,
            request_app_user=mock_app_user,
            resource=realization_with_scenario_and_project,
            editing=False,
            context=context
        )
        msg = f'Could not find the selected project while initializing {realization_with_scenario_and_project}.'
        assert exc.value.args[0] == msg

    mock_messages.error.assert_called_with(
        mock_request, 'An unexpected error occured while initializing your realization.'
    )


def test_handle_resource_finished_processing_no_scenario(
    rf, admin_user, db_session, project, realization_with_scenario_and_project, mock_app_user, mocker, test_files,
    tmp_path
):
    context = {}
    mock_app = mocker.patch('tethysapp.tribs.controllers.realizations.modify_tribs_realization.app')
    mock_app.get_app_workspace.return_value = mock.MagicMock(path=str(tmp_path))
    mocker.patch('tethysapp.tribs.controllers.realizations.modify_tribs_realization.log')
    mock_request = rf.post('/foo/some-id/bar/', data={
        'select_project': str(project.id),
    })
    mock_request.user = admin_user

    mock_messages = mocker.patch('tethysapp.tribs.controllers.realizations.modify_tribs_realization.messages')

    test_zip = os.path.join(test_files, 'controllers', 'realizations', 'p0531200418.zip')
    shutil.copy(test_zip, str(tmp_path))
    realization_with_scenario_and_project.set_attribute('files', [str(tmp_path / 'p0531200418.zip')])

    mtd_controller = ModifyTribsRealization()
    with pytest.raises(ATCoreException) as exc:
        mtd_controller.handle_resource_finished_processing(
            session=db_session,
            request=mock_request,
            request_app_user=mock_app_user,
            resource=realization_with_scenario_and_project,
            editing=False,
            context=context
        )
        msg = f'Could not find the selected project while initializing {realization_with_scenario_and_project}.'
        assert exc.value.args[0] == msg

    mock_messages.error.assert_called_with(
        mock_request, 'An unexpected error occured while initializing your realization.'
    )


def test_handle_resource_finished_processing_no_file(
    rf, admin_user, db_session, project, scenario_with_project, realization_with_scenario_and_project, mock_app_user,
    mocker, tmp_path
):
    context = {}
    mock_app = mocker.patch('tethysapp.tribs.controllers.realizations.modify_tribs_realization.app')
    mock_app.get_app_workspace.return_value = mock.MagicMock(path=str(tmp_path))
    mocker.patch('tethysapp.tribs.controllers.realizations.modify_tribs_realization.log')
    mock_request = rf.post(
        '/foo/some-id/bar/',
        data={
            'select_project': str(project.id),
            'select_scenario': str(scenario_with_project.id),
        }
    )
    mock_request.user = admin_user

    mock_messages = mocker.patch('tethysapp.tribs.controllers.realizations.modify_tribs_realization.messages')

    with mock.patch.dict('os.environ', {'FDB_ROOT_DIR': str(tmp_path)}, clear=True):
        project.init()

        fdc = project.file_database_client
        assert fdc is not None

        realization_with_scenario_and_project.set_attribute('files', [])

        mtd_controller = ModifyTribsRealization()
        with pytest.raises(ATCoreException) as exc:
            mtd_controller.handle_resource_finished_processing(
                session=db_session,
                request=mock_request,
                request_app_user=mock_app_user,
                resource=realization_with_scenario_and_project,
                editing=False,
                context=context
            )
            msg = f'Could not find the selected project while initializing {realization_with_scenario_and_project}.'
            assert exc.value.args[0] == msg

        mock_messages.error.assert_called_with(
            mock_request, 'An unexpected error occured while initializing your realization.'
        )


def test_handle_resource_finished_processing_Editing(
    rf, admin_user, db_session, project, scenario_with_project, realization_with_scenario_and_project, mock_app_user,
    mocker, test_files, tmp_path
):
    context = {}
    mock_app = mocker.patch('tethysapp.tribs.controllers.realizations.modify_tribs_realization.app')
    mock_app.get_app_workspace.return_value = mock.MagicMock(path=str(tmp_path))
    mocker.patch('tethysapp.tribs.controllers.realizations.modify_tribs_realization.log')
    mock_request = rf.post(
        '/foo/some-id/bar/',
        data={
            'select_project': str(project.id),
            'select_scenario': str(scenario_with_project.id),
        }
    )
    mock_request.user = admin_user

    _ = mocker.patch('tethysapp.tribs.controllers.realizations.modify_tribs_realization.messages')

    with mock.patch.dict('os.environ', {'FDB_ROOT_DIR': str(tmp_path)}, clear=True):
        project.init()

        fdc = project.file_database_client
        assert fdc is not None

        test_zip = os.path.join(test_files, 'controllers', 'realizations', 'p0531200418.zip')
        shutil.copy(test_zip, str(tmp_path))
        realization_with_scenario_and_project.set_attribute('files', [str(tmp_path / 'p0531200418.zip')])

        mtd_controller = ModifyTribsRealization()
        mtd_controller.handle_resource_finished_processing(
            session=db_session,
            request=mock_request,
            request_app_user=mock_app_user,
            resource=realization_with_scenario_and_project,
            editing=True,
            context=context
        )


def test_validate_custom_fields_bad_request(project, scenario_with_project, mocker):
    mtd_controller = ModifyTribsRealization()
    _ = mocker.patch('tethysapp.tribs.controllers.realizations.modify_tribs_realization.app')
    _ = mocker.patch('tethysapp.tribs.controllers.realizations.modify_tribs_realization.messages')

    mocker.patch('tethysapp.tribs.controllers.realizations.modify_tribs_realization.log')
    params = {
        'select_project': str(project.id),
        'select_scenario': str(scenario_with_project.id),
    }

    mtd_controller.validate_custom_fields(params)


def test_validate_custom_fields(rf, db_session, project, scenario_with_project, mock_app_user, mocker):
    mtd_controller = ModifyTribsRealization()
    _ = mocker.patch('tethysapp.tribs.controllers.realizations.modify_tribs_realization.app')
    _ = mocker.patch('tethysapp.tribs.controllers.realizations.modify_tribs_realization.messages')
    mock_request = rf.post(
        '/foo/some-id/bar/',
        data={
            'select_project': str(project.id),
            'select_scenario': str(scenario_with_project.id),
        }
    )
    mock_request.user = mock.MagicMock()
    mock_request.user.is_staff.return_value = True
    mock_app_user.get_resources.side_effect = [[project], [scenario_with_project]]

    mocker.patch('tethysapp.tribs.controllers.realizations.modify_tribs_realization.log')
    params = {
        'select_project': str(project.id),
        'select_scenario': str(scenario_with_project.id),
    }

    mtd_controller.validate_custom_fields(
        params,
        session=db_session,
        request=mock_request,
        request_app_user=mock_app_user,
    )


def test_validate_custom_fields_part_2(rf, db_session, project, scenario_with_project, mock_app_user, mocker):
    mtd_controller = ModifyTribsRealization()
    _ = mocker.patch('tethysapp.tribs.controllers.realizations.modify_tribs_realization.app')
    _ = mocker.patch('tethysapp.tribs.controllers.realizations.modify_tribs_realization.messages')
    mock_request = rf.post(
        '/foo/some-id/bar/',
        data={
            'select_project': str(project.id),
            'select_scenario': str(scenario_with_project.id),
        }
    )
    mock_request.user = mock.MagicMock()
    mock_request.user.is_staff.return_value = True
    mock_app_user.get_resources.side_effect = [[project], [scenario_with_project]]

    mocker.patch('tethysapp.tribs.controllers.realizations.modify_tribs_realization.log')
    params = {
        'select_project': str(project.id),
        'select_scenario': 'c303282d-f2e6-46ca-a04a-35d3d873712e',
    }

    mtd_controller.validate_custom_fields(
        params,
        session=db_session,
        request=mock_request,
        request_app_user=mock_app_user,
    )


def test_validate_custom_fields_no_realization(rf, db_session, project, scenario_with_project, mock_app_user, mocker):
    mtd_controller = ModifyTribsRealization()
    _ = mocker.patch('tethysapp.tribs.controllers.realizations.modify_tribs_realization.app')
    _ = mocker.patch('tethysapp.tribs.controllers.realizations.modify_tribs_realization.messages')
    mock_request = rf.post(
        '/foo/some-id/bar/',
        data={
            'select_project': str(project.id),
            'select_scenario': str(scenario_with_project.id),
        }
    )
    mock_request.user = mock.MagicMock()
    mock_request.user.is_staff.return_value = True
    mock_app_user.get_resources.side_effect = [[project], [scenario_with_project]]

    mocker.patch('tethysapp.tribs.controllers.realizations.modify_tribs_realization.log')
    params = {
        'select_project': 'c303282d-f2e6-46ca-a04a-35d3d873712d',
        'select_scenario': 'c303282d-f2e6-46ca-a04a-35d3d873712e',
    }

    mtd_controller.validate_custom_fields(
        params,
        session=db_session,
        request=mock_request,
        request_app_user=mock_app_user,
    )


def test_validate_custom_fields_no_session_user_app(
    rf, db_session, project, scenario_with_project, mock_app_user, mocker
):
    mtd_controller = ModifyTribsRealization()
    _ = mocker.patch('tethysapp.tribs.controllers.realizations.modify_tribs_realization.app')
    _ = mocker.patch('tethysapp.tribs.controllers.realizations.modify_tribs_realization.messages')
    mock_request = rf.post(
        '/foo/some-id/bar/',
        data={
            'select_project': str(project.id),
            'select_scenario': str(scenario_with_project.id),
        }
    )
    mock_request.user = mock.MagicMock()
    mock_request.user.is_staff.return_value = True
    mock_app_user.get_resources.side_effect = [[project], [scenario_with_project]]
    mock_super = mocker.patch('tethysapp.tribs.controllers.realizations.modify_tribs_realization.super')
    mock_super.get_sessionmaker.return_value = db_session
    mtd_controller._AppUser = mock_app_user
    mtd_controller._AppUser.get_app_user_from_request.return_value = mock_app_user

    mocker.patch('tethysapp.tribs.controllers.realizations.modify_tribs_realization.log')
    params = {
        'select_project': 'c303282d-f2e6-46ca-a04a-35d3d873712d',
        'select_scenario': 'c303282d-f2e6-46ca-a04a-35d3d873712e',
    }

    mtd_controller.validate_custom_fields(
        params,
        session=None,
        request=mock_request,
        request_app_user=None,
    )


def test_initialize_custom_fields_not_editing(
    rf, db_session, project, scenario_with_project, realization_with_scenario_and_project, mock_app_user, mocker
):
    mock_super = mocker.patch('tethysapp.tribs.controllers.realizations.modify_tribs_realization.super')
    mock_super.get_sessionmaker.return_value = db_session

    mock_app_user.get_resources.return_value = [project]

    _ = mocker.patch('tethysapp.tribs.controllers.realizations.modify_tribs_realization.messages')

    mock_request = rf.post(
        '/foo/some-id/bar/',
        data={
            'select_project': str(project.id),
            'select_scenario': str(scenario_with_project.id),
        }
    )
    context = {}
    context['project_resources'] = [project]

    mtd_controller = ModifyTribsRealization()
    mtd_controller._AppUser = mock_app_user
    mtd_controller.initialize_custom_fields(
        session=db_session,
        request=mock_request,
        resource=realization_with_scenario_and_project,
        editing=False,
        context=context
    )


def test_initialize_custom_fields(
    rf, db_session, project, scenario_with_project, realization_with_scenario_and_project, mock_app_user, mocker
):
    mock_super = mocker.patch('tethysapp.tribs.controllers.realizations.modify_tribs_realization.super')
    mock_super.get_sessionmaker.return_value = db_session

    mock_app_user.get_resources.return_value = [project]

    _ = mocker.patch('tethysapp.tribs.controllers.realizations.modify_tribs_realization.messages')

    mock_request = rf.post(
        '/foo/some-id/bar/',
        data={
            'select_project': str(project.id),
            'select_scenario': str(scenario_with_project.id),
        }
    )
    context = {}
    context['project_resources'] = [project]

    mtd_controller = ModifyTribsRealization()
    mtd_controller._AppUser = mock_app_user
    mtd_controller.initialize_custom_fields(
        session=db_session,
        request=mock_request,
        resource=realization_with_scenario_and_project,
        editing=True,
        context=context
    )


def test_initialize_custom_fields_no_context(
    rf, db_session, project, scenario_with_project, realization_with_scenario_and_project, mock_app_user, mocker
):
    mock_super = mocker.patch('tethysapp.tribs.controllers.realizations.modify_tribs_realization.super')
    mock_super.get_sessionmaker.return_value = db_session

    mock_app_user.get_resources.return_value = [project]

    _ = mocker.patch('tethysapp.tribs.controllers.realizations.modify_tribs_realization.messages')

    mock_request = rf.post(
        '/foo/some-id/bar/',
        data={
            'select_project': str(project.id),
            'select_scenario': str(scenario_with_project.id),
        }
    )
    context = {}

    mtd_controller = ModifyTribsRealization()
    mtd_controller._AppUser = mock_app_user
    mtd_controller.initialize_custom_fields(
        session=db_session,
        request=mock_request,
        resource=realization_with_scenario_and_project,
        editing=True,
        context=context
    )
