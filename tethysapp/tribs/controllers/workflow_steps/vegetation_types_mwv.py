"""
********************************************************************************
* Name: vegetation_types_mwv.py
* Author: Yue Sun
* Created On: Jul 2, 2024
* Copyright: (c) Aquaveo 2024
********************************************************************************
"""
import logging
import os
import json
from osgeo import ogr
from tethysext.atcore.controllers.resource_workflows.map_workflows import MapWorkflowView
from tribs_adapter.workflow_steps.vegetation_types_rws import VegetationTypesRWS
from tribs_adapter.resources.dataset import Dataset
from tethys_sdk.gizmos import MVView

log = logging.getLogger(f'tethys.{__name__}')


class VegetationTypesMWV(MapWorkflowView):
    """
    Controller for a map workflow view requiring spatial input (drawing).
    """
    template_name = 'tribs/vegetation_types_mwv.html'
    valid_step_classes = [VegetationTypesRWS]

    @staticmethod
    def rgb_to_hex(r, g, b):
        return '#{:02X}{:02X}{:02X}'.format(r, g, b)

    def process_step_options(self, request, session, context, resource, current_step, previous_step, next_step):
        """
        Hook for processing step options (i.e.: modify map or context based on step options).

        Args:
            request(HttpRequest): The request.
            session(sqlalchemy.orm.Session): Session bound to the steps.
            context(dict): Context object for the map view template.
            resource(Resource): the resource for this request.
            current_step(ResourceWorkflowStep): The current step to be rendered.
            previous_step(ResourceWorkflowStep): The previous step.
            next_step(ResourceWorkflowStep): The next step.
        """

        # Note: new layer created by super().process_step_options will have feature selection enabled by default
        super().process_step_options(
            request=request,
            session=session,
            context=context,
            resource=resource,
            current_step=current_step,
            previous_step=previous_step,
            next_step=next_step
        )

        workflow = current_step.workflow
        clean_datasets_step = workflow.get_step_by_name('Clean Datasets')
        vt_output = clean_datasets_step.get_attribute('vt_output')
        # Get processed vt data
        vt_output_dataset = session.query(Dataset).get(vt_output['dataset_id'])
        client = vt_output_dataset.file_collection_client
        for file in client.files:
            # Read .dbf file
            if file.endswith('.dbf'):
                driver = ogr.GetDriverByName('ESRI Shapefile')
                data = driver.Open(os.path.join(client.path, file), 0)
                layers = data.GetLayer()
                types = []
                for feature in layers:
                    types.append(
                        {
                            'VALUE': feature.VALUE,
                            'EVT_NAME': feature.EVT_NAME,
                            'COLOR': VegetationTypesMWV.rgb_to_hex(feature.R, feature.G, feature.B)
                        }
                    )

        vt_viz = vt_output_dataset.get_attribute('viz')

        map_manager = self.get_map_manager(request=request, resource=resource)

        # Create Vegetation Type Layer
        vt_layer = map_manager.build_wms_layer(
            endpoint=vt_viz['url'],
            layer_name=vt_viz['layer'],
            layer_title='Vegetation Types',
            layer_id='vegetation-types',
            layer_variable='vt',
            extent=vt_viz['extent'],
            style='vegetation_types',
        )

        # Create NAIP image layer
        naip_output = clean_datasets_step.get_attribute('naip_output')
        naip_dataset_id = naip_output['naip_dataset_id']
        naip_dataset = session.query(Dataset).get(naip_dataset_id)
        naip_viz = naip_dataset.get_attribute('viz')
        naip_image = map_manager.build_wms_layer(
            endpoint=naip_viz['url'],
            layer_name=naip_viz['layer'],
            layer_title='NAIP Image',
            layer_id='naip-image',
            layer_variable='naip',
            extent=naip_viz['extent'],
            style='naip',
        )

        # Add layers to the map view
        layers = [vt_layer, naip_image]
        map_view = context['map_view']
        map_view.layers.extend(layers)
        map_view.view = MVView(projection='EPSG:4326', extent=vt_viz['extent'], maxZoom=20, minZoom=1)

        # Update Layer groups with layer group for NDVI
        layer_groups = context.get('layer_groups')
        layer_group = map_manager.build_layer_group(
            id='vegetation-types-layer', display_name='Vegetation Types', layers=layers
        )
        layer_groups.append(layer_group)

        context.update(
            {
                'map_view': map_view,
                'layer_groups': layer_groups,
                'extent': vt_viz['extent'],
                'vegetation_types': json.dumps(types)
            }
        )

    def process_step_data(self, request, session, step, resource, current_url, previous_url, next_url):
        """
        Hook for processing user input data coming from the map view. Process form data found in request.POST and request.GET parameters and then return a redirect response to one of the given URLs.

        Args:
            request(HttpRequest): The request.
            session(sqlalchemy.orm.Session): Session bound to the steps.
            step(ResourceWorkflowStep): The step to be updated.
            resource(Resource): the resource for this request.
            current_url(str): URL to step.
            previous_url(str): URL to the previous step.
            next_url(str): URL to the next step.

        Returns:
            HttpResponse: A Django response.

        Raises:
            ValueError: exceptions that occur due to user error, provide helpful message to help user solve issue.
            RuntimeError: exceptions that require developer attention.
        """  # noqa: E501
        # Get the categories data value from POST params
        categories_data = request.POST.get('categories-data', None)
        step.set_parameter('categories', categories_data)
        session.commit()

        # Validate the Parameters
        step.validate()

        # Update the status of the step
        step.set_status(step.ROOT_STATUS_KEY, step.STATUS_COMPLETE)
        step.set_attribute(step.ATTR_STATUS_MESSAGE, None)
        session.commit()

        response = super().process_step_data(
            request=request,
            session=session,
            step=step,
            resource=resource,
            current_url=current_url,
            previous_url=previous_url,
            next_url=next_url
        )

        return response
