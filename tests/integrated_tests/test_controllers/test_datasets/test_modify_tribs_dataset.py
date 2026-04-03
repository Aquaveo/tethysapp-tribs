"""
********************************************************************************
* Name: modify_tribs_dataset.py
* Author: EJones
* Created On: Oct 5, 2023
* Copyright: (c) Aquaveo 2023
********************************************************************************
"""
import os
import shutil
from unittest import mock
import pytest
from tethysapp.tribs.controllers.datasets.modify_tribs_dataset import ModifyTribsDataset
from tethysext.atcore.exceptions import ATCoreException
from tribs_adapter.common.dataset_types import DatasetTypes
from tribs_adapter.resources import Project, Scenario


def test_handle_resource_finished_processing_not_editing(
    rf, db_session, scenario_with_project_with_fdb, new_dataset, mock_app_user, mocker, test_files, tmp_path, admin_user
):
    context = {}
    scenario = scenario_with_project_with_fdb
    project = scenario_with_project_with_fdb.project
    assert project.file_database_client is not None
    mock_app = mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.app')
    mock_app.get_app_workspace.return_value = mock.MagicMock(path=str(tmp_path))
    mock_app.get_user_workspace.return_value = mock.MagicMock(path=str(tmp_path))
    mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.log')
    mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.UploadDatasetWorkflow')
    mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.get_user_workspace')
    mock_request = rf.post(
        '/foo/some-id/bar/',
        data={
            'select_project': str(project.id),
            'select_scenario': str(scenario.id),
            'select_type': DatasetTypes.RASTER_CONT_ASCII
        }
    )
    mock_request.user = admin_user

    _ = mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.messages')

    test_zip = os.path.join(test_files, 'controllers', 'datasets', 'p05312.zip')
    shutil.copy(test_zip, str(tmp_path))
    new_dataset.set_attribute('files', [str(tmp_path / 'p05312.zip')])
    new_dataset.set_attribute('srid', '4326')

    mtd_controller = ModifyTribsDataset()
    mtd_controller.handle_resource_finished_processing(
        session=db_session,
        request=mock_request,
        request_app_user=mock_app_user,
        resource=new_dataset,
        editing=False,
        context=context,
    )

    assert new_dataset.dataset_type == DatasetTypes.RASTER_CONT_ASCII
    assert scenario in new_dataset.linked_scenarios
    assert new_dataset.project == project

    # # ProjectUploadWorkflow Testing
    # mock_puw.assert_called()
    # mock_puw_call_args = mock_puw.call_args_list

    # assert mock_request.user == mock_puw_call_args[0][1]['user']
    # assert mock_resource.name == mock_puw_call_args[0][1]['workflow_name']
    # assert mock_resource.get_attribute() == mock_puw_call_args[0][1]['srid']
    # assert mock_app.get_persistent_store_database() == mock_puw_call_args[0][1]['resource_db_url']
    # assert str(mock_resource.id) == mock_puw_call_args[0][1]['resource_id']
    # assert 'scenario_id' == mock_puw_call_args[0][1]
    # assert m_md == mock_puw_call_args[0][1]['model_db']
    # assert mock_app.get_spatial_dataset_service() == mock_puw_call_args[0][1]['gs_engine']
    # assert mock_puw_call_args[0][1]['with_link_node_datasets'] is True

    # mock_puw().run_job.assert_called()
    # mock_log.info.assert_called()
    # mock_session.close.assert_not_called()


def test_handle_resource_finished_processing_not_editing_no_scenario(
    rf, db_session, scenario_with_project_with_fdb, new_dataset, mock_app_user, mocker, test_files, tmp_path, admin_user
):
    context = {}
    scenario = scenario_with_project_with_fdb
    project = scenario_with_project_with_fdb.project
    assert project.file_database_client is not None
    mock_app = mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.app')
    mock_app.get_app_workspace.return_value = mock.MagicMock(path=str(tmp_path))
    mock_app.get_user_workspace.return_value = mock.MagicMock(path=str(tmp_path))
    mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.log')
    mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.UploadDatasetWorkflow')
    mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.get_user_workspace')
    mock_request = rf.post(
        '/foo/some-id/bar/',
        data={
            'select_project': str(project.id),
            'select_scenario': "",
            'select_type': DatasetTypes.RASTER_CONT_ASCII
        }
    )
    mock_request.user = admin_user

    _ = mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.messages')

    test_zip = os.path.join(test_files, 'controllers', 'datasets', 'p05312.zip')
    shutil.copy(test_zip, str(tmp_path))
    new_dataset.set_attribute('files', [str(tmp_path / 'p05312.zip')])
    new_dataset.set_attribute('srid', '4326')

    mtd_controller = ModifyTribsDataset()
    mtd_controller.handle_resource_finished_processing(
        session=db_session,
        request=mock_request,
        request_app_user=mock_app_user,
        resource=new_dataset,
        editing=False,
        context=context,
    )

    assert new_dataset.dataset_type == DatasetTypes.RASTER_CONT_ASCII
    assert scenario not in new_dataset.linked_scenarios
    assert new_dataset.project == project


def test_handle_resource_finished_processing_no_project(
    rf, db_session, scenario_with_project_with_fdb, new_dataset, mock_app_user, mocker, test_files, tmp_path
):
    context = {}
    scenario = scenario_with_project_with_fdb
    mock_app = mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.app')
    mock_app.get_app_workspace.return_value = mock.MagicMock(path=str(tmp_path))
    mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.log')
    mock_request = rf.post(
        '/foo/some-id/bar/', data={
            'select_scenario': str(scenario.id),
            'select_type': DatasetTypes.RASTER_CONT_ASCII
        }
    )

    mock_messages = mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.messages')

    test_zip = os.path.join(test_files, 'controllers', 'datasets', 'p0531200418.txt')
    shutil.copy(test_zip, str(tmp_path))
    new_dataset.set_attribute('files', [str(tmp_path / 'p0531200418.zip')])

    mtd_controller = ModifyTribsDataset()
    with pytest.raises(ATCoreException) as exc:
        mtd_controller.handle_resource_finished_processing(
            session=db_session,
            request=mock_request,
            request_app_user=mock_app_user,
            resource=new_dataset,
            editing=False,
            context=context
        )

    msg = f'Unable to find the selected project while initializing {new_dataset}.'
    assert exc.value.args[0] == msg  # exc.value cannot be accessed until exiting the context manager
    mock_messages.error.assert_called_with(mock_request, 'An unexpected error occured while initializing your dataset.')


def test_handle_resource_finished_processing_cannot_find_scenario(
    rf, db_session, scenario_with_project_with_fdb, new_dataset, mock_app_user, mocker, test_files, tmp_path
):
    context = {}
    project = scenario_with_project_with_fdb.project
    mock_app = mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.app')
    mock_app.get_app_workspace.return_value = mock.MagicMock(path=str(tmp_path))
    mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.log')
    mock_request = rf.post(
        '/foo/some-id/bar/',
        data={
            'select_project': str(project.id),
            'select_scenario': '00000000-0000-4000-a000-000000000000',  # does not exist
            'select_type': DatasetTypes.RASTER_CONT_ASCII
        }
    )

    mock_messages = mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.messages')

    test_zip = os.path.join(test_files, 'controllers', 'datasets', 'p0531200418.txt')
    shutil.copy(test_zip, str(tmp_path))
    new_dataset.set_attribute('files', [str(tmp_path / 'p0531200418.zip')])

    mtd_controller = ModifyTribsDataset()
    with pytest.raises(ATCoreException) as exc:
        mtd_controller.handle_resource_finished_processing(
            session=db_session,
            request=mock_request,
            request_app_user=mock_app_user,
            resource=new_dataset,
            editing=False,
            context=context
        )

    msg = f'Unable to find the selected scenario while initializing {new_dataset}.'
    assert exc.value.args[0] == msg  # exc.value cannot be accessed until exiting the context manager
    mock_messages.error.assert_called_with(mock_request, 'An unexpected error occured while initializing your dataset.')


def test_handle_resource_finished_processing_bad_zip_file(
    rf, db_session, scenario_with_project_with_fdb, new_dataset, mock_app_user, mocker, test_files, tmp_path
):
    context = {}
    scenario = scenario_with_project_with_fdb
    project = scenario_with_project_with_fdb.project
    mock_app = mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.app')
    mock_app.get_app_workspace.return_value = mock.MagicMock(path=str(tmp_path))
    mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.log')
    mock_request = rf.post(
        '/foo/some-id/bar/',
        data={
            'select_project': str(project.id),
            'select_scenario': str(scenario.id),
            'select_type': DatasetTypes.RASTER_CONT_ASCII
        }
    )

    mock_messages = mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.messages')

    test_zip = os.path.join(test_files, 'controllers', 'datasets', 'p0531200418.zip')
    shutil.copy(test_zip, str(tmp_path))
    new_dataset.set_attribute('files', [str(tmp_path / 'p0531200418.zip')])

    mtd_controller = ModifyTribsDataset()
    with pytest.raises(ATCoreException) as exc:
        mtd_controller.handle_resource_finished_processing(
            session=db_session,
            request=mock_request,
            request_app_user=mock_app_user,
            resource=new_dataset,
            editing=False,
            context=context
        )

    msg = f'Could not find files in uploaded zip archive while initializing {new_dataset}.'
    assert exc.value.args[0] == msg

    mock_messages.error.assert_called_with(
        mock_request, 'Could not find files in uploaded zip archive while initializing your dataset.'
    )


def test_handle_resource_finished_processing_zip_file(
    rf, db_session, scenario_with_project_with_fdb, new_dataset, mock_app_user, mocker, test_files, tmp_path, admin_user
):
    context = {}
    scenario = scenario_with_project_with_fdb
    project = scenario_with_project_with_fdb.project
    assert project.file_database_client is not None
    mock_app = mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.app')
    mock_app.get_app_workspace.return_value = mock.MagicMock(path=str(tmp_path))
    mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.log')
    mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.UploadDatasetWorkflow')
    mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.get_user_workspace')
    mock_request = rf.post(
        '/foo/some-id/bar/',
        data={
            'select_project': str(project.id),
            'select_scenario': str(scenario.id),
            'select_type': DatasetTypes.RASTER_CONT_ASCII
        }
    )
    mock_request.user = admin_user

    _ = mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.messages')

    test_zip = os.path.join(test_files, 'controllers', 'datasets', 'p05312.zip')
    shutil.copy(test_zip, str(tmp_path))
    new_dataset.set_attribute('files', [str(tmp_path / 'p05312.zip')])
    new_dataset.set_attribute('srid', '4326')

    mtd_controller = ModifyTribsDataset()
    mtd_controller.handle_resource_finished_processing(
        session=db_session,
        request=mock_request,
        request_app_user=mock_app_user,
        resource=new_dataset,
        editing=False,
        context=context
    )

    assert new_dataset.dataset_type == DatasetTypes.RASTER_CONT_ASCII
    assert scenario in new_dataset.linked_scenarios
    assert new_dataset.project == project


def test_handle_resource_finished_processing_no_file(
    rf, db_session, scenario_with_project_with_fdb, new_dataset, mock_app_user, mocker, admin_user
):
    context = {}
    scenario = scenario_with_project_with_fdb
    project = scenario_with_project_with_fdb.project
    assert project.file_database_client is not None
    mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.log')
    mock_request = rf.post(
        '/foo/some-id/bar/',
        data={
            'select_project': str(project.id),
            'select_scenario': str(scenario.id),
            'select_type': DatasetTypes.RASTER_CONT_ASCII
        }
    )
    mock_request.user = admin_user

    mock_messages = mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.messages')

    new_dataset.set_attribute('files', [])

    mtd_controller = ModifyTribsDataset()
    with pytest.raises(ATCoreException) as exc:
        mtd_controller.handle_resource_finished_processing(
            session=db_session,
            request=mock_request,
            request_app_user=mock_app_user,
            resource=new_dataset,
            editing=False,
            context=context
        )

    msg = f'Files were not found while initializing {new_dataset}.'
    assert exc.value.args[0] == msg

    mock_messages.error.assert_called_with(mock_request, 'An unexpected error occured while initializing your dataset.')


def test_handle_resource_finished_processing_editing(
    rf, db_session, dataset_with_scenario_and_project, mock_app_user, mocker, test_files, tmp_path
):
    context = {}
    dataset = dataset_with_scenario_and_project
    project = dataset_with_scenario_and_project.project
    scenario = dataset_with_scenario_and_project.linked_scenarios[0]

    # New values to "edit" the dataset with
    new_project = Project(name='new_project')
    new_scenario = Scenario(name='new_scenario')
    new_scenario.project = new_project
    db_session.add(new_project)
    db_session.commit()
    with mock.patch.dict('os.environ', {'FDB_ROOT_DIR': str(tmp_path)}, clear=True):
        new_project.init()
        assert new_project.file_database_client is not None

        mock_app = mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.app')
        mock_app.get_app_workspace.return_value = mock.MagicMock(path=str(tmp_path))
        mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.log')
        mock_request = rf.post(
            '/foo/some-id/bar/',
            data={
                'select_project': str(new_project.id),
                'select_scenario': str(new_scenario.id),
                'select_type': DatasetTypes.RASTER_CONT_GEOTIFF
            }
        )

        _ = mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.messages')

        test_zip = os.path.join(test_files, 'controllers', 'datasets', 'p0531200418.zip')
        shutil.copy(test_zip, str(tmp_path))
        dataset_with_scenario_and_project.set_attribute('files', [str(tmp_path / 'p0531200418.zip')])

        assert dataset.project == project
        assert scenario in dataset.linked_scenarios
        assert dataset.dataset_type == DatasetTypes.JSON

        mtd_controller = ModifyTribsDataset()
        mtd_controller.handle_resource_finished_processing(
            session=db_session,
            request=mock_request,
            request_app_user=mock_app_user,
            resource=dataset_with_scenario_and_project,
            editing=True,
            context=context
        )

        assert dataset.project == new_project
        assert dataset.dataset_type == DatasetTypes.RASTER_CONT_GEOTIFF
        assert new_scenario in dataset.linked_scenarios
        assert scenario not in dataset.linked_scenarios


def test_validate_custom_fields_bad_request(project, scenario_with_project, mocker):
    mtd_controller = ModifyTribsDataset()
    _ = mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.app')
    _ = mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.messages')

    mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.log')
    params = {
        'select_project': str(project.id),
        'select_scenario': str(scenario_with_project.id),
        'select_type': DatasetTypes.RASTER_CONT_ASCII
    }

    mtd_controller.validate_custom_fields(params)


def test_validate_custom_fields(rf, db_session, project, scenario_with_project, mock_app_user, mocker):
    mtd_controller = ModifyTribsDataset()
    _ = mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.app')
    _ = mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.messages')
    mock_request = rf.post(
        '/foo/some-id/bar/',
        data={
            'select_project': str(project.id),
            'select_scenario': str(scenario_with_project.id),
            'select_type': DatasetTypes.RASTER_CONT_ASCII
        }
    )
    mock_request.user = mock.MagicMock()
    mock_request.user.is_staff.return_value = True
    mock_app_user.get_resources.side_effect = [[project], [scenario_with_project]]

    mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.log')
    params = {
        'select_project': str(project.id),
        'select_scenario': str(scenario_with_project.id),
        'select_type': DatasetTypes.RASTER_CONT_ASCII
    }

    mtd_controller.validate_custom_fields(
        params,
        session=db_session,
        request=mock_request,
        request_app_user=mock_app_user,
    )


def test_validate_custom_fields_part_2(rf, db_session, project, scenario_with_project, mock_app_user, mocker):
    mtd_controller = ModifyTribsDataset()
    _ = mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.app')
    _ = mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.messages')
    mock_request = rf.post(
        '/foo/some-id/bar/',
        data={
            'select_project': str(project.id),
            'select_scenario': str(scenario_with_project.id),
            'select_type': DatasetTypes.RASTER_CONT_ASCII
        }
    )
    mock_request.user = mock.MagicMock()
    mock_request.user.is_staff.return_value = True
    mock_app_user.get_resources.side_effect = [[project], [scenario_with_project]]

    mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.log')
    params = {
        'select_project': str(project.id),
        'select_scenario': 'c303282d-f2e6-46ca-a04a-35d3d873712e',
        'select_type': DatasetTypes.RASTER_CONT_ASCII
    }

    mtd_controller.validate_custom_fields(
        params,
        session=db_session,
        request=mock_request,
        request_app_user=mock_app_user,
    )


def test_validate_custom_fields_no_dataset(rf, db_session, project, scenario_with_project, mock_app_user, mocker):
    mtd_controller = ModifyTribsDataset()
    _ = mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.app')
    _ = mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.messages')
    mock_request = rf.post(
        '/foo/some-id/bar/',
        data={
            'select_project': str(project.id),
            'select_scenario': str(scenario_with_project.id),
            'select_type': DatasetTypes.RASTER_CONT_ASCII
        }
    )
    mock_request.user = mock.MagicMock()
    mock_request.user.is_staff.return_value = True
    mock_app_user.get_resources.side_effect = [[project], [scenario_with_project]]

    mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.log')
    params = {
        'select_project': 'c303282d-f2e6-46ca-a04a-35d3d873712d',
        'select_scenario': 'c303282d-f2e6-46ca-a04a-35d3d873712e',
        'select_type': None
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
    mtd_controller = ModifyTribsDataset()
    _ = mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.app')
    _ = mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.messages')
    mock_request = rf.post(
        '/foo/some-id/bar/',
        data={
            'select_project': str(project.id),
            'select_scenario': str(scenario_with_project.id),
            'select_type': DatasetTypes.RASTER_CONT_ASCII
        }
    )
    mock_request.user = mock.MagicMock()
    mock_request.user.is_staff.return_value = True
    mock_app_user.get_resources.side_effect = [[project], [scenario_with_project]]
    mock_super = mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.super')
    mock_super.get_sessionmaker.return_value = db_session
    mtd_controller._AppUser = mock_app_user
    mtd_controller._AppUser.get_app_user_from_request.return_value = mock_app_user

    mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.log')
    params = {
        'select_project': 'c303282d-f2e6-46ca-a04a-35d3d873712d',
        'select_scenario': 'c303282d-f2e6-46ca-a04a-35d3d873712e',
        'select_type': None
    }

    mtd_controller.validate_custom_fields(
        params,
        session=None,
        request=mock_request,
        request_app_user=None,
    )


def test_initialize_custom_fields_not_editing(
    rf, db_session, project, scenario_with_project, dataset_with_scenario_and_project, mock_app_user, mocker
):
    mock_super = mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.super')
    mock_super.get_sessionmaker.return_value = db_session

    mock_app_user.get_resources.return_value = [project]

    _ = mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.messages')

    mock_request = rf.post(
        '/foo/some-id/bar/',
        data={
            'select_project': str(project.id),
            'select_scenario': str(scenario_with_project.id),
            'select_type': DatasetTypes.RASTER_CONT_ASCII
        }
    )
    context = {}
    context['project_resources'] = [project]

    mtd_controller = ModifyTribsDataset()
    mtd_controller._AppUser = mock_app_user
    mtd_controller.initialize_custom_fields(
        session=db_session,
        request=mock_request,
        resource=dataset_with_scenario_and_project,
        editing=False,
        context=context
    )


def test_initialize_custom_fields(
    rf, db_session, project, scenario_with_project, dataset_with_scenario_and_project, mock_app_user, mocker
):
    mock_super = mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.super')
    mock_super.get_sessionmaker.return_value = db_session

    mock_app_user.get_resources.return_value = [project]

    _ = mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.messages')

    mock_request = rf.post(
        '/foo/some-id/bar/',
        data={
            'select_project': str(project.id),
            'select_scenario': str(scenario_with_project.id),
            'select_type': DatasetTypes.RASTER_CONT_ASCII
        }
    )
    context = {}
    context['project_resources'] = [project]

    mtd_controller = ModifyTribsDataset()
    mtd_controller._AppUser = mock_app_user
    mtd_controller.initialize_custom_fields(
        session=db_session,
        request=mock_request,
        resource=dataset_with_scenario_and_project,
        editing=True,
        context=context
    )


def test_initialize_custom_fields_no_context(
    rf, db_session, project, scenario_with_project, dataset_with_scenario_and_project, mock_app_user, mocker
):
    mock_super = mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.super')
    mock_super.get_sessionmaker.return_value = db_session

    mock_app_user.get_resources.return_value = [project]

    _ = mocker.patch('tethysapp.tribs.controllers.datasets.modify_tribs_dataset.messages')

    mock_request = rf.post(
        '/foo/some-id/bar/',
        data={
            'select_project': str(project.id),
            'select_scenario': str(scenario_with_project.id),
            'select_type': DatasetTypes.RASTER_CONT_ASCII
        }
    )
    context = {}

    mtd_controller = ModifyTribsDataset()
    mtd_controller._AppUser = mock_app_user
    mtd_controller.initialize_custom_fields(
        session=db_session,
        request=mock_request,
        resource=dataset_with_scenario_and_project,
        editing=True,
        context=context
    )
