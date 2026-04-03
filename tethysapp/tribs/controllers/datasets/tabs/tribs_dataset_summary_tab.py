"""
********************************************************************************
* Name: tribs_dataset_summary_tab.py
* Created On: Oct 2, 2023
* Copyright: (c) Aquaveo 2023
********************************************************************************
"""
import os
from collections import OrderedDict
from django.shortcuts import reverse

from tethysext.atcore.controllers.resources import ResourceSummaryTab
# from tribs_adapter.services.tribs_spatial_manager import TribsSpatialManager
# from tethysapp.tribs.services.tribs_map_manager import TribsMapManager
from tethysapp.tribs.controllers.utilities import human_readable_size


class TribsDatasetSummaryTab(ResourceSummaryTab):
    has_preview_image = False
    preview_image_title = 'Map Preview'

    # def get_map_manager(self, request, resource):
    #     # Build spatial manager
    #     gs_engine = self.get_app().get_spatial_dataset_service(self.get_app().GEOSERVER_NAME, as_engine=True)
    #     # spatial_manager = GsshaSpatialManager(geoserver_engine=gs_engine)
    #     spatial_manager = TribsSpatialManager(geoserver_engine=gs_engine)
    #     return TribsMapManager(spatial_manager=spatial_manager, resource=resource)

    def get_summary_tab_info(self, request, session, resource, *args, **kwargs):
        """Define tRIBS specific summary info.

        Args:
            request (django.http.HttpRequest): the Django request object.
            session (sqlalchemy.orm.Session): the SQLAlchemy session object.
            resource (Resource): the Resource.
        """
        summary_columns = [
            [],  # Place holder for the first column, which is auto-populated with default extent and description
        ]

        related_params = OrderedDict()
        file_collection_details = OrderedDict()

        # Summary of related resources
        if resource.children or resource.parents:
            if resource.parents:
                related_params['Parent Project'] = ""
                project = resource.project
                if project is not None:
                    url = reverse('tribs:tribs_project_details_tab', args=[project.id, 'summary'])
                    link = f'<a href="{url}">{project.name}</a>'
                    related_params[link] = project.description

                related_params['Linked Scenarios'] = ""
                related_params['Scenario Count'] = len(resource.linked_scenarios)
                for scenario in resource.linked_scenarios:
                    url = reverse('tribs:tribs_scenario_details_tab', args=[scenario.id, 'summary'])
                    link = f'<a href="{url}">{scenario.name}</a>'
                    related_params[link] = scenario.description

                related_resources_name = 'Related Resources'
                related_resources_table = (related_resources_name, related_params)

                if len(summary_columns) > 1:
                    # Add to the last column
                    summary_columns[-1].append(related_resources_table)
                else:
                    # Add to new second column
                    summary_columns.append([related_resources_table])

        # related_params['File Collection'] = ""
        file_count = 0
        total_size = 0
        if resource.file_collection_client:
            file_collection_details['File Collection ID'] = resource.file_collection_client._collection_id
            for file in resource.file_collection_client.files:
                if file != '__meta__.json':
                    file_count += 1
                    file_size = os.path.getsize(os.path.join(resource.file_collection_client.path, file))
                    total_size += file_size

            total_size, units = human_readable_size(total_size)

            file_collection_details['File Count'] = file_count
            file_collection_details[f'Total Size ({units})'] = total_size

            file_database_details_name = 'File Collection Details'
            file_database_details_table = (file_database_details_name, file_collection_details)

            if len(summary_columns) > 1:
                # Add to the last column
                summary_columns[-1].append(file_database_details_table)
            else:
                # Add to new second column
                summary_columns.append([file_database_details_table])

        return summary_columns

    # def get_preview_image_url(self, request, resource, *args, **kwargs):
    #     """
    #     Get URL from GeoServer that will generate a PNG of the default layers.
    #     """
    #     map_manager = self.get_map_manager(request, resource)
    #     layer_preview_url = map_manager.get_map_preview_url()
    #     return layer_preview_url
