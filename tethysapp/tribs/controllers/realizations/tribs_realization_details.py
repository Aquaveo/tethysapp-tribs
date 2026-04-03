"""
********************************************************************************
* Name: tribs_dataset_details.py
* Author: EJones
* Created On: Sep 20, 2018
* Copyright: (c) Aquaveo 2023
********************************************************************************
"""
__all__ = ['TribsRealizationDetails']

import logging
from tethys_sdk.permissions import has_permission
from tethysext.atcore.controllers.resources import TabbedResourceDetails

from tethysapp.tribs.controllers.realizations.tabs.tribs_realization_summary_tab import TribsRealizationSummaryTab
from tethysapp.tribs.controllers.realizations.tabs.tribs_realization_inputfile_tab import TribsRealizationInputfileTab
from tethysapp.tribs.controllers.realizations.tabs.tribs_realization_datasets_tab import TribsRealizationDatasetsTab

log = logging.getLogger('tethys.' + __name__)


class TribsRealizationDetails(TabbedResourceDetails):
    """
    Controller for tribs scenario details page(s).
    """
    base_template = 'tribs/base.html'
    template_name = 'tribs/tribs_resource_details.html'
    tabs = (
        {
            'slug': 'summary',
            'title': 'Summary',
            'view': TribsRealizationSummaryTab
        },
        {
            'slug': 'inputfile',
            'title': 'Input File',
            'view': TribsRealizationInputfileTab
        },
        {
            'slug': 'datasets',
            'title': 'Datasets',
            'view': TribsRealizationDatasetsTab
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
