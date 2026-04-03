"""
********************************************************************************
* Name: tribs_scenario_details.py
* Author: EJones
* Created On: Sep 20, 2018
* Copyright: (c) Aquaveo 2023
********************************************************************************
"""
__all__ = ['TribsScenarioDetails']

import logging
from tethys_sdk.permissions import has_permission
from tethysext.atcore.controllers.resources import TabbedResourceDetails

from tethysapp.tribs.controllers.scenarios.tabs.tribs_scenario_datasets_tab import TribsScenarioDatasetsTab
from tethysapp.tribs.controllers.scenarios.tabs.tribs_scenario_realizations_tab import TribsScenarioRealizationsTab
from tethysapp.tribs.controllers.scenarios.tabs.tribs_scenario_inputfile_tab import TribsScenarioInputfileTab
from tethysapp.tribs.controllers.scenarios.tabs.tribs_scenario_summary_tab import TribsScenarioSummaryTab

log = logging.getLogger('tethys.' + __name__)


class TribsScenarioDetails(TabbedResourceDetails):
    """
    Controller for tribs scenario details page(s).
    """
    base_template = 'tribs/base.html'
    template_name = 'tribs/tribs_resource_details.html'
    tabs = (
        {
            'slug': 'summary',
            'title': 'Summary',
            'view': TribsScenarioSummaryTab
        },
        {
            'slug': 'inputfile',
            'title': 'Input File',
            'view': TribsScenarioInputfileTab
        },
        {
            'slug': 'datasets',
            'title': 'Datasets',
            'view': TribsScenarioDatasetsTab
        },
        {
            'slug': 'realizations',
            'title': 'Realizations',
            'view': TribsScenarioRealizationsTab
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
