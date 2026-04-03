"""
********************************************************************************
* Name: tribs_project_details.py
* Author: EJones
* Created On: Sep 20, 2018
* Copyright: (c) Aquaveo 2023
********************************************************************************
"""
__all__ = ['TribsProjectDetails']

import logging
from tethys_sdk.permissions import has_permission
from tethysext.atcore.controllers.resources import TabbedResourceDetails

from tethysapp.tribs.controllers.projects.tabs.tribs_project_summary_tab import TribsProjectSummaryTab
from tethysapp.tribs.controllers.projects.tabs.tribs_project_scenarios_tab import TribsProjectScenariosTab
from tethysapp.tribs.controllers.projects.tabs.tribs_project_datasets_tab import TribsProjectDatasetsTab
from tethysapp.tribs.controllers.projects.tabs.tribs_project_workflows_tab import TribsProjectWorkflowsTab

log = logging.getLogger('tethys.' + __name__)


class TribsProjectDetails(TabbedResourceDetails):
    """
    Controller for tribs project details page(s).
    """
    base_template = 'tribs/base.html'
    template_name = 'tribs/tribs_resource_details.html'
    tabs = (
        {
            'slug': 'summary',
            'title': 'Summary',
            'view': TribsProjectSummaryTab
        },
        {
            'slug': 'scenarios',
            'title': 'Scenarios',
            'view': TribsProjectScenariosTab
        },
        {
            'slug': 'datasets',
            'title': 'Datasets',
            'view': TribsProjectDatasetsTab
        },
        {
            'slug': 'workflows',
            'title': 'Workflows',
            'view': TribsProjectWorkflowsTab
        },
    )

    def get_context(self, request, context, *args, **kwargs):
        """
        Hook to add additional content to context. Avoid removing or modifying items in context already to prevent unexpected behavior.

        Args:
            request (HttpRequest): The request.
            context (dict): The context dictionary.
        Returns:
            dict: modified context dictionary.
        """  # noqa: E501
        # Permission for Manage back button (admins)
        context.update({
            "can_manage_resources": has_permission(request, "edit_resource"),
        })
        return super().get_context(request, context, *args, **kwargs)
