import logging

from django.contrib import messages
from django.shortcuts import redirect
from tethys_sdk.routing import controller
from tethysext.atcore.controllers.resource_view import ResourceView

from tethysapp.tribs.app import Tribs as app

log = logging.getLogger(__name__)


@controller(name='project_editor', url='project/{resource_id}/editor')
class ProjectEditor(ResourceView):
    _app = app
    _persistent_store_name = app.DATABASE_NAME
    view_title = 'Project Editor'
    view_subtitle = 'some project'
    template_name = 'tribs/project_editor.html'

    def on_get(self, request, session, resource, *args, **kwargs):
        # atcore returns None (rather than raising) for a project id that is not in the database, e.g. a stale tab
        # open on a project that has since been deleted. Rendering the editor with no project would fail while
        # building the "Project Details" link, so send the user back to the project list instead.
        if resource is None:
            resource_id = kwargs.get('resource_id', self.kwargs.get('resource_id', ''))
            log.warning(f'Project editor requested for a project that does not exist: "{resource_id}".')
            messages.warning(request, 'That project no longer exists. It may have been deleted.')
            return redirect('tribs:projects_manage_resources')
        return super().on_get(request, session, resource, *args, **kwargs)

    def get_context(self, request, session, resource, context, *args, **kwargs):
        context.update({
            'project': resource,
        })
        return context
