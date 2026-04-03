"""
********************************************************************************
* Name: tribs_project_summary_tab.py
* Created On: Oct 2, 2023
* Copyright: (c) Aquaveo 2023
********************************************************************************
"""
import os
from collections import OrderedDict
# from django.shortcuts import reverse
from tethysext.atcore.controllers.resources import ResourceSummaryTab
from tethysapp.tribs.controllers.utilities import human_readable_size


class TribsProjectSummaryTab(ResourceSummaryTab):
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

        # Summary of related GSSHA Models
        if resource.children:
            related_params = OrderedDict()

            if resource.scenarios:
                related_params['Scenario Count'] = len(resource.scenarios)

            if resource.datasets:
                related_params['Dataset Count'] = len(resource.datasets)

            related_resources_name = 'Related Resources'
            related_resources_table = (related_resources_name, related_params)

            if len(summary_columns) > 1:
                # Add to the last column
                summary_columns[-1].append(related_resources_table)
            else:
                # Add to new second column
                summary_columns.append([related_resources_table])

        if resource.file_database_client:
            file_database_details = OrderedDict()
            # file_db = resource.file_database_client
            file_database_details['File Database ID'] = resource.file_database_id
            file_database_details['File Collection Count'] = len(resource.file_database.collections)
            file_count = 0
            total_size = 0
            for collection in resource.file_database.collections:
                if not collection.dataset or not collection.dataset.file_collection_client:
                    continue

                for file in collection.dataset.file_collection_client.files:
                    if file != '__meta__.json':
                        file_count += 1
                        file_size = os.path.getsize(os.path.join(collection.dataset.file_collection_client.path, file))
                        total_size += file_size

            total_size, units = human_readable_size(total_size)

            file_database_details['File Count'] = file_count
            file_database_details[f'Total Size ({units})'] = total_size

            file_database_details_name = 'File Database Details'
            file_database_details_table = (file_database_details_name, file_database_details)

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
