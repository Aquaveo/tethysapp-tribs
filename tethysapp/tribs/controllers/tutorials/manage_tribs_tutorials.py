import logging
from tethysext.atcore.controllers.app_users import ManageResources
from tethysapp.tribs.controllers.manage_resource_delete_mixin import ManageResourceDeleteMixin

log = logging.getLogger(__name__)


class ManageTribsTutorials(ManageResourceDeleteMixin, ManageResources):
    template_name = 'tribs/manage_tutorials.html'
    row_template = 'tribs/tutorial_row.html'
