from tethys_sdk.routing import controller
from tethysext.atcore.controllers.resource_view import ResourceView

from tethysapp.tribs.app import Tribs as app


@controller(name='project_editor', url='project/{resource_id}/editor')
class ProjectEditor(ResourceView):
    _app = app
    _persistent_store_name = app.DATABASE_NAME
    view_title = 'Project Editor'
    view_subtitle = 'some project'
    template_name = 'tribs/project_editor.html'

    def get_context(self, request, session, resource, context, *args, **kwargs):
        context.update({
            'project': resource,
        })
        return context
