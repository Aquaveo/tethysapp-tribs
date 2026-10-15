from unittest import mock

from tethysapp.tribs.controllers.projects.project_editor import ProjectEditor


def test_on_get_redirects_when_project_is_missing(rf, mocker):
    """A stale editor URL for a deleted project goes back to the project list instead of a 500."""
    mock_log = mocker.patch('tethysapp.tribs.controllers.projects.project_editor.log')
    mock_messages = mocker.patch('tethysapp.tribs.controllers.projects.project_editor.messages')
    mock_redirect = mocker.patch('tethysapp.tribs.controllers.projects.project_editor.redirect')

    editor = ProjectEditor()
    editor.kwargs = {'resource_id': 'deleted-project'}
    request = rf.get('/apps/tribs/project/deleted-project/editor/')
    ret = editor.on_get(request, session=mock.MagicMock(), resource=None, resource_id='deleted-project')

    assert ret is mock_redirect.return_value
    mock_redirect.assert_called_with('tribs:projects_manage_resources')
    mock_messages.warning.assert_called_once()
    assert 'deleted-project' in mock_log.warning.call_args[0][0]


def test_on_get_passes_through_when_project_exists(rf, mocker):
    mock_redirect = mocker.patch('tethysapp.tribs.controllers.projects.project_editor.redirect')
    editor = ProjectEditor()
    editor.kwargs = {}
    ret = editor.on_get(rf.get('/'), session=mock.MagicMock(), resource=mock.MagicMock())
    assert ret is None
    mock_redirect.assert_not_called()


def test_get_context_adds_project(rf):
    editor = ProjectEditor()
    project = mock.MagicMock()
    context = editor.get_context(rf.get('/'), session=mock.MagicMock(), resource=project, context={'a': 1})
    assert context == {'a': 1, 'project': project}
