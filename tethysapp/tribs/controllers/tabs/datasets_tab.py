"""
********************************************************************************
* Name: datasets_tab.py
* Created On: Sep 10, 2026
* Copyright: (c) Aquaveo 2026
********************************************************************************
"""
import os
import tempfile

from django.urls import reverse
from tethysext.atcore.controllers.resources import ResourceListTab


class DatasetsTab(ResourceListTab):
    # Generated visualization artifacts stored alongside the source files in the collections
    exclude_dirs = ('czml', 'gltf')

    def get_resources(self, request, resource, session, *args, **kwargs):
        """
        Get a list of resources

        Returns:
            A list of Resources.
        """
        return resource.linked_datasets

    def download_all(self, request, resource, session, *args, **kwargs):
        """
        Download all datasets for a given resource.

        Args:
            request (HttpRequest): The current request object.
            resource (Resource): The current Resource.
            session (Session): The current database session.
        """
        with tempfile.TemporaryDirectory() as temp_dir:
            all_files = []
            resource.export(temp_dir, with_datasets=True)
            for root, dirs, files in os.walk(temp_dir):
                dirs[:] = [d for d in dirs if d not in self.exclude_dirs]
                for file in files:
                    abs_path = os.path.join(root, file)
                    all_files.append((abs_path, os.path.relpath(abs_path, temp_dir)))

            return self._zip_response(all_files, f'{resource.name}.zip')

    def get_href_for_resource(self, app_namespace, resource):
        """
        Hook to allow implementations of ResourceListTab to provide action href.
        Args:
            app_namespace (str): the namespace of the app.
            resource (Resource): the current Resource.

        Returns:
            str: the href for the given resource.
        """
        return reverse(f'{app_namespace}:tribs_dataset_details_tab', args=[resource.id, 'summary'])
