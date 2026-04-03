# """
# ********************************************************************************
# * Name: modify_tribs_project.py
# * Author: EJones
# * Created On: Oct 5, 2023
# * Copyright: (c) Aquaveo 2023
# ********************************************************************************
# """
from unittest import mock
import pytest
from tethysapp.tribs.controllers.projects.modify_tribs_project import ModifyTribsProject
from tethysext.atcore.exceptions import ATCoreException


def test_handle_resource_finished_processing_not_editing(
    db_session, mock_request, project, mock_app_user, mocker, tmp_path, project_extent_geojson_str
):
    context = {}
    mocker.patch('tethysapp.tribs.controllers.projects.modify_tribs_project.log')
    mock_request.POST = {"geometry": project_extent_geojson_str}
    _ = mocker.patch('tethysapp.tribs.controllers.projects.modify_tribs_project.messages')

    with mock.patch.dict('os.environ', {'FDB_ROOT_DIR': str(tmp_path)}, clear=True):
        mtp_controller = ModifyTribsProject()
        mtp_controller.handle_resource_finished_processing(
            session=db_session,
            request=mock_request,
            request_app_user=mock_app_user,
            resource=project,
            editing=False,
            context=context,
        )

        assert project.file_database_id is not None


def test_handle_resource_finished_processing_fail(
    db_session, mock_request, project, mock_app_user, mocker, project_extent_geojson_str
):
    context = {}
    mocker.patch('tethysapp.tribs.controllers.projects.modify_tribs_project.log')
    mock_messages = mocker.patch('tethysapp.tribs.controllers.projects.modify_tribs_project.messages')
    mock_request.POST = {"geometry": project_extent_geojson_str}
    project.init = mocker.Mock(side_effect=Exception("Test init exception."))  # Raise an exception

    mtp_controller = ModifyTribsProject()
    with pytest.raises(ATCoreException) as exc:
        mtp_controller.handle_resource_finished_processing(
            session=db_session,
            request=mock_request,
            request_app_user=mock_app_user,
            resource=project,
            editing=False,
            context=context,
        )
    assert exc.value.args[0] == f'An unexpected error occured while initializing {project}.'

    mock_messages.error.assert_called_with(mock_request, 'An unexpected error occured while initializing your project.')


#     # @mock.patch('tethysapp.tribs.controllers.projects.modify_tribs_project.get_user_workspace')
#     @mock.patch('tethysapp.tribs.controllers.projects.modify_tribs_project.log')
#     @mock.patch('tethysapp.tribs.controllers.projects.modify_tribs_project.app')
#     # @mock.patch('tethysapp.tribs.controllers.projects.modify_tribs_project.ProjectUploadWorkflow')
#     def test_handle_resource_finished_processing_not_editing(self, mock_app, mock_log):
#         # m_md = mock_md()
#         # m_md.initialize.return_value = True
#         # mock_os.path.exists.return_value = False
#         context = {}

#         self.mtp_controller.handle_resource_finished_processing(
#             session=self.mock_session,
#             request=self.mock_request,
#             request_app_user=self.mock_app_user,
#             resource=self.mock_resource,
#             editing=False,
#             context=context,
#         )

#         # m_md.initialize.assert_called_with(declarative_bases=(GsshaPyBase,), spatial=True)
#         self.mock_resource.set_attribute.assert_called()
#         # mra_call_args = self.mock_resource.set_attribute.call_args_list
#         # self.assertEqual('database_id', mra_call_args[0][0][0])
#         self.mock_session.commit.assert_called()

#         # # ProjectUploadWorkflow Testing
#         # mock_puw.assert_called()
#         # mock_puw_call_args = mock_puw.call_args_list

#         # self.assertEqual(self.mock_request.user, mock_puw_call_args[0][1]['user'])
#         # self.assertEqual(self.mock_resource.name, mock_puw_call_args[0][1]['workflow_name'])
#         # self.assertEqual(self.mock_resource.get_attribute(), mock_puw_call_args[0][1]['srid'])
#         # self.assertEqual(mock_app.get_persistent_store_database(), mock_puw_call_args[0][1]['resource_db_url'])
#         # self.assertEqual(str(self.mock_resource.id), mock_puw_call_args[0][1]['resource_id'])
#         # self.assertNotIn('scenario_id', mock_puw_call_args[0][1])
#         # self.assertEqual(m_md, mock_puw_call_args[0][1]['model_db'])
#         # self.assertEqual(mock_app.get_spatial_dataset_service(), mock_puw_call_args[0][1]['gs_engine'])
#         # self.assertEqual(True, mock_puw_call_args[0][1]['with_link_node_datasets'])

#         # mock_puw().run_job.assert_called()
#         # mock_log.info.assert_called()
#         self.mock_session.close.assert_not_called()

#     @mock.patch('tethysapp.tribs.controllers.projects.modify_tribs_project.app')
#     def test_handle_resource_finished_processing_initialize_error(self, _):
#         self.mock_resource.init.side_effect = Exception
#         context = {}
#         self.mtp_controller.handle_resource_finished_processing(
#             session=self.mock_session,
#             request=self.mock_request,
#             request_app_user=self.mock_app_user,
#             resource=self.mock_resource,
#             editing=False,
#             context=context,
#         )
