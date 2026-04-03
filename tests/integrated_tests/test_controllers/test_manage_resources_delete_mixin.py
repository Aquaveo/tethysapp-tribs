"""
********************************************************************************
* Name: test_manage_resources_delted_mixin.py
* Author: EJones
* Created On: Oct 5, 2023
* Copyright: (c) Aquaveo 2023
********************************************************************************
"""
import os
import shutil
from unittest import mock
from django.http import JsonResponse
from tribs_adapter.resources import Project, Scenario, Realization, Dataset
from tethysapp.tribs.controllers.manage_resource_delete_mixin import ManageResourceDeleteMixin
from tethysapp.tribs.controllers.projects.manage_tribs_projects import ManageTribsProjects
from tethys_apps.base.workspace import TethysWorkspace


def test__handle_delete(
    rf,
    db_url,
    project,
    mocker,
):
    mock_thread = mocker.patch('tethysapp.tribs.controllers.manage_resource_delete_mixin.Thread')
    mocker.patch('tethys_apps.decorators.isinstance', side_effect=[False, True, False])
    mocker.patch('tethys_apps.decorators.has_permission', return_value=True)
    mtd_controller = ManageTribsProjects()
    mtd_controller._Resource = Project
    mock_session = mock.MagicMock(get_bind=mock.MagicMock(return_value=mock.MagicMock(url=db_url)), )
    mock_session.query().get.return_value = project
    mtd_controller.get_sessionmaker = mock.MagicMock(return_value=mock.MagicMock(return_value=mock_session))
    request = rf.delete(
        '/apps/tribs/projects/', data={
            'id': str(project.id),
            'deleteType': 'resources',
            'action': 'delete',
        }
    )

    ret = mtd_controller._handle_delete(request, str(project.id))  # Note: must be passed as args

    mock_thread.assert_called_with(
        target=mtd_controller.delete_resource_artifacts, args=(request, project.id, db_url), daemon=True
    )
    mock_thread().start.assert_called()
    assert isinstance(ret, JsonResponse)
    assert ret.status_code == 200
    assert ret.content == b'{"success": true}'


def test__handle_delete_exception(
    rf,
    db_url,
    project,
    mocker,
):
    mock_log = mocker.patch('tethysapp.tribs.controllers.manage_resource_delete_mixin.log')
    mock_thread = mocker.patch('tethysapp.tribs.controllers.manage_resource_delete_mixin.Thread')
    mock_thread.side_effect = Exception('foo')  # Raises exception
    mocker.patch('tethys_apps.decorators.isinstance', side_effect=[False, True, False])
    mocker.patch('tethys_apps.decorators.has_permission', return_value=True)
    mtd_controller = ManageTribsProjects()
    mtd_controller._Resource = Project
    mock_session = mock.MagicMock(get_bind=mock.MagicMock(return_value=mock.MagicMock(url=db_url)), )
    mock_session.query().get.return_value = project
    mtd_controller.get_sessionmaker = mock.MagicMock(return_value=mock.MagicMock(return_value=mock_session))
    request = rf.delete(
        '/apps/tribs/projects/', data={
            'id': str(project.id),
            'deleteType': 'resources',
            'action': 'delete',
        }
    )

    ret = mtd_controller._handle_delete(request, str(project.id))  # Note: must be passed as args

    mock_thread.assert_called_with(
        target=mtd_controller.delete_resource_artifacts, args=(request, project.id, db_url), daemon=True
    )
    assert isinstance(ret, JsonResponse)
    assert ret.status_code == 200
    assert ret.content == b'{"success": false, "error": "Exception(\'foo\')"}'
    mock_log.exception.assert_called_with(
        f'An unexpected error occurred while trying to delete resource with ID "{str(project.id)}": foo'
    )


def test_delete_resource_artifacts(rf, db_url, project, mocker, test_files, tmp_path):
    mock_rv = mocker.patch(
        'tethysapp.tribs.controllers.manage_resource_delete_mixin.'
        'ManageResourceDeleteMixin.remove_visualizations'
    )
    mock_drf = mocker.patch(
        'tethysapp.tribs.controllers.manage_resource_delete_mixin.'
        'ManageResourceDeleteMixin.delete_resource_files'
    )
    mock_dfdba = mocker.patch(
        'tethysapp.tribs.controllers.manage_resource_delete_mixin.'
        'ManageResourceDeleteMixin.delete_filedatabase_artifacts'
    )
    mock_dcj = mocker.patch(
        'tethysapp.tribs.controllers.manage_resource_delete_mixin.'
        'ManageResourceDeleteMixin.delete_condor_jobs'
    )
    mock_dc = mocker.patch(
        'tethysapp.tribs.controllers.manage_resource_delete_mixin.'
        'ManageResourceDeleteMixin.delete_children'
    )
    mocker.patch('tethysapp.tribs.controllers.manage_resource_delete_mixin.log')

    # Must mock session maker b/c the test db is created in transaction:
    # therfore, can't see/query tables from new session created by delete_resource_artifacts
    mock_sessionmaker = mocker.patch('tethysapp.tribs.controllers.manage_resource_delete_mixin.sessionmaker')
    mock_session = mock.MagicMock()
    mock_sessionmaker.return_value = mock.MagicMock(return_value=mock_session)

    request = rf.delete(
        '/apps/tribs/projects/', data={
            'id': str(project.id),
            'deleteType': 'resources',
            'action': 'delete',
        }
    )

    mtd_controller = ManageResourceDeleteMixin()
    mtd_controller._Resource = Project

    mtd_controller.delete_resource_artifacts(
        request=request,
        resource_id=project.id,
        session_url=db_url,
    )

    mock_session.query.assert_called_with(Project)
    mock_rv.assert_called()
    mock_drf.assert_called()
    mock_dfdba.assert_called()
    mock_dcj.assert_called()
    mock_dc.assert_called()


def test_delete_resource_files_project(rf, complete_project, tmp_path, mocker):
    project = complete_project
    mocker.patch('tethysapp.tribs.controllers.manage_resource_delete_mixin.log')
    mock_app = mocker.patch('tethysapp.tribs.controllers.manage_resource_delete_mixin.app')
    mock_app.get_app_workspace.return_value = mock.MagicMock(path=tmp_path)
    mtd_controller = ManageResourceDeleteMixin()
    request = rf.delete(
        '/apps/tribs/projects/', data={
            'id': str(project.id),
            'deleteType': 'resources',
            'action': 'delete',
        }
    )

    assert len(list(tmp_path.glob('**/*.*'))) == 48  # FDB files + uploaded files in the "files" attribute

    mtd_controller.delete_resource_files(
        request=request,
        resource=project,
    )

    assert len(list(tmp_path.glob('**/*.*'))) == 45  # 3 files deleted - scenario, dataset, and realization uploads


def test_delete_resource_files_scenario(rf, complete_project, tmp_path, mocker):
    project = complete_project
    scenario = project.scenarios[0]
    # mocker.patch('tethysapp.tribs.controllers.manage_resource_delete_mixin.log')
    mock_app = mocker.patch('tethysapp.tribs.controllers.manage_resource_delete_mixin.app')
    mock_app.get_app_workspace.return_value = mock.MagicMock(path=tmp_path)
    mtd_controller = ManageResourceDeleteMixin()
    request = rf.delete(
        '/apps/tribs/scenarios/', data={
            'id': str(scenario.id),
            'deleteType': 'resources',
            'action': 'delete',
        }
    )

    assert len(list(tmp_path.glob('**/*.*'))) == 48  # FDB files + uploaded files in the "files" attribute

    mtd_controller.delete_resource_files(
        request=request,
        resource=scenario,
    )

    assert len(list(tmp_path.glob('**/*.*'))) == 45  # 2 files deleted - scenario and dataset uploads


def test_delete_resource_files_realization(rf, complete_project, tmp_path, mocker):
    project = complete_project
    scenario = project.scenarios[0]
    realization = scenario.realizations[0]
    mocker.patch('tethysapp.tribs.controllers.manage_resource_delete_mixin.log')
    mock_app = mocker.patch('tethysapp.tribs.controllers.manage_resource_delete_mixin.app')
    mock_app.get_app_workspace.return_value = mock.MagicMock(path=tmp_path)
    mtd_controller = ManageResourceDeleteMixin()
    request = rf.delete(
        '/apps/tribs/realizations/', data={
            'id': str(realization.id),
            'deleteType': 'resources',
            'action': 'delete',
        }
    )

    assert len(list(tmp_path.glob('**/*.*'))) == 48  # FDB files + uploaded files in the "files" attribute

    mtd_controller.delete_resource_files(
        request=request,
        resource=realization,
    )

    assert len(list(tmp_path.glob('**/*.*'))) == 47  # 1 file deleted - realization upload


def test_delete_workspace_artifacts(mock_request, mocker, test_files, tmp_path):
    _ = mocker.patch('tethysapp.tribs.controllers.manage_resource_delete_mixin.Thread')
    mocker.patch('tethysapp.tribs.controllers.manage_resource_delete_mixin.log')
    mock_app = mocker.patch('tethysapp.tribs.controllers.manage_resource_delete_mixin.app')
    app_workspace_path = TethysWorkspace(os.path.join(tmp_path, 'app_workspace'))
    user_workspace_path = TethysWorkspace(os.path.join(tmp_path, 'user_workspace'))
    mock_app.get_app_workspace.return_value = app_workspace_path
    mock_app.get_user_workspace.return_value = user_workspace_path

    test_zip = os.path.join(test_files, 'controllers', 'datasets', 'p05312.zip')
    shutil.copy(test_zip, str(tmp_path))
    tmp_file = str(os.path.join(tmp_path, 'p05312.zip'))
    shutil.copy(test_zip, str(app_workspace_path.path))
    tmp_file2 = str(os.path.join(app_workspace_path.path, 'p05312.zip'))
    shutil.copy(test_zip, str(user_workspace_path.path))
    tmp_file3 = str(os.path.join(user_workspace_path.path, 'p05312.zip'))
    tmp_dir = os.path.join(tmp_path, 'notAFolder')
    tmp_dir2 = os.path.join(tmp_path, 'folder')
    os.mkdir(tmp_dir)

    mtd_controller = ManageResourceDeleteMixin()
    mtd_controller.delete_workspace_artifacts(
        request=mock_request,
        workspace_artifact=[
            tmp_dir, tmp_dir2, tmp_file, tmp_file2, tmp_file3, user_workspace_path.path, app_workspace_path.path
        ],
    )


def test_validate_cwd_file_not_found(mocker, ):
    mock_app = mocker.patch('tethysapp.tribs.controllers.manage_resource_delete_mixin.app')
    mocker.patch('tethysapp.tribs.controllers.manage_resource_delete_mixin.log')
    mock_app.get_app_workspace.return_value = None

    mock_getcwd = mock.MagicMock()
    mock_getcwd.side_effect = FileNotFoundError("Current working directory not found")

    mtp_controller = ManageResourceDeleteMixin()
    with mock.patch('os.getcwd', mock_getcwd):
        mtp_controller.validate_cwd()


def test_delete_condor_jobs(
    mock_request,
    project,
    mocker,
):
    _ = mocker.patch('tethysapp.tribs.controllers.manage_resource_delete_mixin.Thread')
    mocker.patch('tethysapp.tribs.controllers.manage_resource_delete_mixin.log')

    mtd_controller = ManageResourceDeleteMixin()
    mtd_controller.delete_condor_jobs(
        request=mock_request,
        resource=project,
    )


def test_delete_children_project(rf, db_session, complete_project, tmp_path, mocker):
    mocker.patch('tethysapp.tribs.controllers.manage_resource_delete_mixin.log')
    project = complete_project

    assert len(project.scenarios) == 1
    assert len(project.scenarios[0].realizations) == 1
    assert len(project.datasets) == 19

    scenario_id = project.scenarios[0].id
    realization_id = project.scenarios[0].realizations[0].id
    dataset_ids = [dataset.id for dataset in project.datasets]

    mtd_controller = ManageResourceDeleteMixin()

    mtd_controller.delete_children(resource=project, )

    assert len(project.scenarios) == 0
    assert len(project.datasets) == 0

    assert db_session.query(Scenario).get(scenario_id) is None
    assert db_session.query(Realization).get(realization_id) is None
    for dataset_id in dataset_ids:
        assert db_session.query(Dataset).get(dataset_id) is None


def test_delete_children_scenario(rf, db_session, complete_project, tmp_path, mocker):
    mocker.patch('tethysapp.tribs.controllers.manage_resource_delete_mixin.log')
    project = complete_project
    scenario = project.scenarios[0]

    assert len(project.scenarios) == 1
    assert len(project.scenarios[0].realizations) == 1
    assert len(project.datasets) == 19

    scenario_id = project.scenarios[0].id
    realization_id = project.scenarios[0].realizations[0].id
    dataset_ids = [dataset.id for dataset in project.datasets]

    mtd_controller = ManageResourceDeleteMixin()

    mtd_controller.delete_children(resource=scenario, )

    assert len(project.scenarios) == 1
    assert len(project.datasets) == 0

    assert db_session.query(Scenario).get(scenario_id) is not None
    assert db_session.query(Realization).get(realization_id) is None
    for dataset_id in dataset_ids:
        assert db_session.query(Dataset).get(dataset_id) is None


def test_delete_children_realization(rf, db_session, complete_project, tmp_path, mocker):
    mocker.patch('tethysapp.tribs.controllers.manage_resource_delete_mixin.log')
    project = complete_project
    scenario = project.scenarios[0]
    realization = scenario.realizations[0]

    assert len(project.scenarios) == 1
    assert len(project.scenarios[0].realizations) == 1
    assert len(project.datasets) == 19

    scenario_id = project.scenarios[0].id
    realization_id = project.scenarios[0].realizations[0].id
    s_dataset_ids = [dataset.id for dataset in scenario.linked_datasets]
    r_dataset_ids = [dataset.id for dataset in realization.linked_datasets]

    mtd_controller = ManageResourceDeleteMixin()

    mtd_controller.delete_children(resource=realization, )

    assert len(project.scenarios) == 1
    assert len(project.datasets) == 12

    assert db_session.query(Scenario).get(scenario_id) is not None
    assert db_session.query(Realization).get(realization_id) is not None
    for sid in s_dataset_ids:
        assert db_session.query(Dataset).get(sid) is not None
    for rid in r_dataset_ids:
        assert db_session.query(Dataset).get(rid) is None


def test_delete_filedatabase_artifacts_project(rf, complete_project, tmp_path, mocker):
    project = complete_project
    mocker.patch('tethysapp.tribs.controllers.manage_resource_delete_mixin.log')
    mtd_controller = ManageResourceDeleteMixin()
    request = rf.delete(
        '/apps/tribs/projects/', data={
            'id': str(project.id),
            'deleteType': 'resources',
            'action': 'delete',
        }
    )

    assert len(list(tmp_path.glob('**/*.*'))) == 48  # FDB files + 3 uploaded files in the "files" attributes

    mtd_controller.delete_filedatabase_artifacts(
        request=request,
        resource=project,
    )

    # all but 3 files deleted - entire fdb deleted, 3 uploaded files remain
    assert len(list(tmp_path.glob('**/*.*'))) == 3


def test_delete_filedatabase_artifacts_scenario(rf, complete_project, tmp_path, mocker):
    project = complete_project
    scenario = project.scenarios[0]
    mocker.patch('tethysapp.tribs.controllers.manage_resource_delete_mixin.log')
    mtd_controller = ManageResourceDeleteMixin()
    request = rf.delete(
        '/apps/tribs/scenarios/', data={
            'id': str(scenario.id),
            'deleteType': 'resources',
            'action': 'delete',
        }
    )

    assert len(list(tmp_path.glob('**/*.*'))) == 48  # FDB files + 3 uploaded files in the "files" attributes

    mtd_controller.delete_filedatabase_artifacts(
        request=request,
        resource=scenario,
    )

    # all but 4 files deleted - 3 uploaded files and fdb meta file remain
    assert len(list(tmp_path.glob('**/*.*'))) == 4


def test_delete_filedatabase_artifacts_realization(rf, complete_project, tmp_path, mocker):
    project = complete_project
    scenario = project.scenarios[0]
    realization = scenario.realizations[0]
    mocker.patch('tethysapp.tribs.controllers.manage_resource_delete_mixin.log')
    mtd_controller = ManageResourceDeleteMixin()
    request = rf.delete(
        '/apps/tribs/realizations/', data={
            'id': str(realization.id),
            'deleteType': 'resources',
            'action': 'delete',
        }
    )
    assert len(list(tmp_path.glob('**/*.*'))) == 48  # FDB files + 3 uploaded files in the "files" attributes

    mtd_controller.delete_filedatabase_artifacts(
        request=request,
        resource=realization,
    )

    # all but 32 files deleted - 3 uploaded files and fdb metafile, and scenario dataset file collections remain
    assert len(list(tmp_path.glob('**/*.*'))) == 32


def test_delete_filedatabase_artifacts_dataset(rf, complete_project, tmp_path, mocker):
    project = complete_project
    scenario = project.scenarios[0]
    dataset = next(d for d in scenario.linked_datasets if d.name == 'Soil Grid')
    dataset_dir = dataset.file_collection_client.path
    dataset_files = set(os.path.join(dataset_dir, file) for file in dataset.file_collection_client.files)
    mocker.patch('tethysapp.tribs.controllers.manage_resource_delete_mixin.log')
    mtd_controller = ManageResourceDeleteMixin()
    request = rf.delete(
        '/apps/tribs/datasets/', data={
            'id': str(dataset.id),
            'deleteType': 'resources',
            'action': 'delete',
        }
    )

    before_files = set(str(f) for f in tmp_path.rglob('*') if f.is_file())
    mtd_controller.delete_filedatabase_artifacts(
        request=request,
        resource=dataset,
    )
    after_files = set(str(f) for f in tmp_path.rglob('*') if f.is_file())
    deleted_files = before_files - after_files
    assert deleted_files == dataset_files, (f"Deleted files: {deleted_files}\n"
                                            f"Expected: {dataset_files}")


def test_remove_visualizations_project(rf, db_session, complete_project, tmp_path, mocker):
    project = complete_project
    project.scenarios[0]
    mocker.patch('tethysapp.tribs.controllers.manage_resource_delete_mixin.log')
    mock_rv = mocker.patch('tribs_adapter.resources.dataset.Dataset.remove_visualization')
    mocker.patch('tethysapp.tribs.controllers.manage_resource_delete_mixin.app')
    mtd_controller = ManageResourceDeleteMixin()
    request = rf.delete(
        '/apps/tribs/projects/', data={
            'id': str(project.id),
            'deleteType': 'resources',
            'action': 'delete',
        }
    )

    mtd_controller.remove_visualizations(
        request=request,
        resource=project,
        session=db_session,
    )

    # remove_visualization called on all 19 datasets in project
    assert mock_rv.call_count == 19


def test_remove_visualizations_scenario(rf, db_session, complete_project, tmp_path, mocker):
    project = complete_project
    scenario = project.scenarios[0]
    mocker.patch('tethysapp.tribs.controllers.manage_resource_delete_mixin.log')
    mock_rv = mocker.patch('tribs_adapter.resources.dataset.Dataset.remove_visualization')
    mocker.patch('tethysapp.tribs.controllers.manage_resource_delete_mixin.app')
    mtd_controller = ManageResourceDeleteMixin()
    request = rf.delete(
        '/apps/tribs/scenarios/', data={
            'id': str(scenario.id),
            'deleteType': 'resources',
            'action': 'delete',
        }
    )

    mtd_controller.remove_visualizations(
        request=request,
        resource=scenario,
        session=db_session,
    )

    # remove_visualization called on all 19 datasets in project (Scenario + Realization child)
    assert mock_rv.call_count == 19


def test_remove_visualizations_realization(rf, db_session, complete_project, tmp_path, mocker):
    project = complete_project
    scenario = project.scenarios[0]
    realization = scenario.realizations[0]
    mocker.patch('tethysapp.tribs.controllers.manage_resource_delete_mixin.log')
    mock_rv = mocker.patch('tribs_adapter.resources.dataset.Dataset.remove_visualization')
    mocker.patch('tethysapp.tribs.controllers.manage_resource_delete_mixin.app')
    mtd_controller = ManageResourceDeleteMixin()
    request = rf.delete(
        '/apps/tribs/realizations/', data={
            'id': str(realization.id),
            'deleteType': 'resources',
            'action': 'delete',
        }
    )

    mtd_controller.remove_visualizations(
        request=request,
        resource=realization,
        session=db_session,
    )

    # remove_visualization called on 7 dataset linked with realization
    assert mock_rv.call_count == 7


def test_remove_visualizations_dataset(rf, db_session, complete_project, tmp_path, mocker):
    project = complete_project
    scenario = project.scenarios[0]
    scenario.realizations[0]
    dataset = scenario.linked_datasets[0]
    mocker.patch('tethysapp.tribs.controllers.manage_resource_delete_mixin.log')
    mock_rv = mocker.patch('tribs_adapter.resources.dataset.Dataset.remove_visualization')
    mocker.patch('tethysapp.tribs.controllers.manage_resource_delete_mixin.app')
    mtd_controller = ManageResourceDeleteMixin()
    request = rf.delete(
        '/apps/tribs/datasets/', data={
            'id': str(dataset.id),
            'deleteType': 'resources',
            'action': 'delete',
        }
    )

    mtd_controller.remove_visualizations(
        request=request,
        resource=dataset,
        session=db_session,
    )

    # remove_visualization called on 7 dataset linked with realization
    assert mock_rv.call_count == 1
