import logging
from django.shortcuts import reverse
from tethysext.atcore.controllers.app_users import ManageResources
from tethysapp.tribs.controllers.manage_resource_delete_mixin import ManageResourceDeleteMixin

log = logging.getLogger(__name__)


class ManageTribsProjects(ManageResourceDeleteMixin, ManageResources):
    default_action_title = "Open"

    def get_launch_url(self, request, resource):
        """
        Get the URL for the Resource Launch button.
        """
        return reverse('tribs:project_editor', args=[resource.id])

    def get_info_url(self, request, resource):
        """
        Get the URL for the Resource name link and row click.
        """
        return reverse('tribs:tribs_project_details_tab', args=[resource.id, 'summary'])

    def get_error_url(self, request, resource):
        """
        Get the URL for the Resource Launch button.
        """
        return reverse('tribs:tribs_project_details_tab', args=[resource.id, 'summary'])
