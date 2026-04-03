"""
********************************************************************************
* Name: tribs_scenario_summary_tab.py
* Created On: Oct 2, 2023
* Copyright: (c) Aquaveo 2023
********************************************************************************
"""
from collections import OrderedDict

from django.shortcuts import reverse

from tethysext.atcore.controllers.resources import ResourceSummaryTab

# from TribsMapManager_adapter.services.gssha_spatial_manager import GsshaSpatialManager
# from tribs_adapter.services.tribs_spatial_manager import TribsSpatialManager

# from tethysapp.tribs.services.tribs_map_manager import TribsMapManager
# from tethysapp.agwa.services.scenario_card_helpers import get_summary_params
# from tethysapp.agwa.services.gssha_resource_helpers import get_model_db_for


class TribsScenarioSummaryTab(ResourceSummaryTab):
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

        # Summary of related resources
        if resource.children or resource.parents:
            related_params = OrderedDict()
            if resource.parents:
                related_params['Parent Project'] = ""
                for parent in resource.parents:
                    url = reverse('tribs:tribs_project_details_tab', args=[parent.id, 'summary'])
                    link = f'<a href="{url}">{parent.name}</a>'
                    related_params[link] = parent.description

            datasets = resource.linked_datasets
            if datasets:
                related_params['Dataset Count'] = len(datasets)

            realizations = resource.realizations
            if realizations:
                related_params['Realization Count'] = len(realizations)

            related_resources_name = 'Related Resources'
            related_resources_table = (related_resources_name, related_params)

            if len(summary_columns) > 1:
                # Add to the last column
                summary_columns[-1].append(related_resources_table)
            else:
                # Add to new second column
                summary_columns.append([related_resources_table])

        return summary_columns

    # def get_preview_image_url(self, request, resource, *args, **kwargs):
    #     """
    #     Get URL from GeoServer that will generate a PNG of the default layers.
    #     """
    #     map_manager = self.get_map_manager(request, resource)
    #     layer_preview_url = map_manager.get_map_preview_url()
    #     return layer_preview_url
