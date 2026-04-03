"""
********************************************************************************
* Name: tribs_scenario_datasets_tab.py
* Created On: Oct 2, 2023
* Copyright: (c) Aquaveo 2023
********************************************************************************
"""
from tethysext.atcore.controllers.resources import ResourceFilesTab


class TribsDatasetFilesTab(ResourceFilesTab):
    def get_file_collections(self, request, resource, session, *args, **kwargs):
        """
        Get a list of resources

        Returns:
            A list of Resources.
        """
        return [resource.file_collection_client]
