"""
********************************************************************************
* Name: tribs_scenario_datasets_tab.py
* Created On: Oct 2, 2023
* Copyright: (c) Aquaveo 2023
********************************************************************************
"""
from django.urls import reverse
from tethysext.atcore.controllers.resources import ResourceListTab


class TribsProjectScenariosTab(ResourceListTab):
    def get_resources(self, request, resource, session, *args, **kwargs):
        """
        Get a list of resources

        Returns:
            A list of Resources.
        """
        return resource.scenarios

    def get_href_for_resource(self, app_namespace, resource):
        """
        Hook to allow implementations of ResourceListTab to provide action href.
        Args:
            app_namespace (str): the namespace of the app.
            resource (Resource): the current Resource.

        Returns:
            str: the href for the given resource.
        """
        return reverse(f'{app_namespace}:tribs_scenario_details_tab', args=[resource.id, 'summary'])
