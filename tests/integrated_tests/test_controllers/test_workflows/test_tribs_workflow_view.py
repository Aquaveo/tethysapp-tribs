import uuid
from tethysapp.tribs.controllers.workflows.tribs_workflow_view import TribsWorkflowRouter


def test_default_back_url_workflows_tab_referer(rf, admin_user, mocker):
    resource_id = str(uuid.uuid4())
    workflow_id = str(uuid.uuid4())
    step_id = str(uuid.uuid4())
    referer = f'http://example.com/apps/tribs/projects/{resource_id}/details/workflows/'
    headers = {'HTTP_REFERER': referer}
    mock_request = rf.get(
        f'/apps/tribs/resources/{resource_id}/prepare_soils_workflow/{workflow_id}/step/{step_id}/', **headers
    )
    mock_request.user = admin_user

    mtd_controller = TribsWorkflowRouter()

    mock_reverse = mocker.patch('tethysapp.tribs.controllers.workflows.tribs_workflow_view.reverse')
    mock_reverse.return_value = f'/apps/tribs/projects/{resource_id}/details/workflows/'
    ret = mtd_controller.default_back_url(
        request=mock_request,
        resource_id=resource_id,
    )
    mock_reverse.assert_called_with(
        'tribs:tribs_project_details_tab', kwargs={
            'resource_id': resource_id,
            'tab_slug': 'workflows'
        }
    )
    # Back links to workflows tab
    assert ret == f'/apps/tribs/projects/{resource_id}/details/workflows/'


def test_default_back_url_project_editor_referer(rf, admin_user, mocker):
    resource_id = str(uuid.uuid4())
    workflow_id = str(uuid.uuid4())
    step_id = str(uuid.uuid4())
    referer = f'http://example.com/apps/tribs/project/{resource_id}/editor/'
    headers = {'HTTP_REFERER': referer}
    mock_request = rf.get(
        f'/apps/tribs/resources/{resource_id}/prepare_soils_workflow/{workflow_id}/step/{step_id}/', **headers
    )
    mock_request.user = admin_user

    mtd_controller = TribsWorkflowRouter()
    mock_reverse = mocker.patch('tethysapp.tribs.controllers.workflows.tribs_workflow_view.reverse')
    mock_reverse.return_value = f'/apps/tribs/project/{resource_id}/editor/'
    ret = mtd_controller.default_back_url(
        request=mock_request,
        resource_id=resource_id,
    )
    mock_reverse.assert_called_with('tribs:project_editor', kwargs={'resource_id': resource_id})
    # Back links to project editor
    assert ret == f'/apps/tribs/project/{resource_id}/editor/'


def test_default_back_url_no_referer(rf, admin_user, mocker):
    resource_id = str(uuid.uuid4())
    workflow_id = str(uuid.uuid4())
    step_id = str(uuid.uuid4())
    referer = ''  # No referer
    headers = {'HTTP_REFERER': referer}
    mock_request = rf.get(
        f'/apps/tribs/resources/{resource_id}/prepare_soils_workflow/{workflow_id}/step/{step_id}/', **headers
    )
    mock_request.user = admin_user

    mtd_controller = TribsWorkflowRouter()
    mock_reverse = mocker.patch('tethysapp.tribs.controllers.workflows.tribs_workflow_view.reverse')
    mock_reverse.return_value = f'/apps/tribs/project/{resource_id}/editor/'
    ret = mtd_controller.default_back_url(
        request=mock_request,
        resource_id=resource_id,
    )
    mock_reverse.assert_called_with('tribs:project_editor', kwargs={'resource_id': resource_id})
    # Back links to project editor
    assert ret == f'/apps/tribs/project/{resource_id}/editor/'
