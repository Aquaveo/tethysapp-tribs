"""
********************************************************************************
* Name: ndvi_mwv.py
* Author: Yue Sun
* Created On: Jun 11, 2024
* Copyright: (c) Aquaveo 2024
********************************************************************************
"""
import logging
from tethysext.atcore.controllers.resource_workflows.map_workflows import MapWorkflowView
from tribs_adapter.workflow_steps.ndvi_rws import NDVIRWS
from tribs_adapter.resources.dataset import Dataset

from tethys_sdk.gizmos import MVView

log = logging.getLogger(f'tethys.{__name__}')


class NDVIMWV(MapWorkflowView):
    """
    Controller for a map workflow view requiring spatial input (drawing).
    """
    template_name = 'tribs/ndvi_mwv.html'
    valid_step_classes = [NDVIRWS]

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

        # Find NDVI Dataset from previous Form Input step (user selects it)
        workflow = current_step.workflow
        naip_output = workflow.get_attribute('naip_output')
        naip_dataset_id, ndvi_dataset_id = naip_output['naip_dataset_id'], naip_output['ndvi_dataset_id']
        ndvi_max, ndvi_median = naip_output['max'], naip_output['median']
        ndvi_threshold = current_step.get_parameter('ndvi_threshold')
        if not ndvi_threshold:
            ndvi_threshold = ndvi_median

        # Get Map View
        map_view = context['map_view']

        # Get Viz data from Dataset
        naip_dataset = session.query(Dataset).get(naip_dataset_id)
        ndvi_dataset = session.query(Dataset).get(ndvi_dataset_id)
        naip_viz = naip_dataset.get_attribute('viz')
        ndvi_viz = ndvi_dataset.get_attribute('viz')

        # Create new Layer for NDVI Dataset and add it to the map_view
        map_manager = self.get_map_manager(request=request, resource=resource)
        naip_image = map_manager.build_wms_layer(
            endpoint=naip_viz['url'],
            layer_name=naip_viz['layer'],
            layer_title='NAIP Image',
            layer_id='naip-image',
            layer_variable='naip',
            extent=naip_viz['extent'],
            style='raster_rgb',
        )
        ndvi_layer = map_manager.build_wms_layer(
            endpoint=ndvi_viz['url'],
            layer_name=ndvi_viz['layer'],
            layer_title='NDVI Layer',
            layer_id='ndvi-layer',
            layer_variable='ndvi',
            extent=ndvi_viz['extent'],
            style='ndvi',
            env=f'ndvi_threshold:{ndvi_threshold};ndvi_max:{ndvi_max}'
        )
        layers = [ndvi_layer, naip_image]
        map_view.layers.extend(layers)

        map_view.view = MVView(projection='EPSG:4326', extent=naip_viz['extent'], maxZoom=20, minZoom=1)

        # Update Layer groups with layer group for NDVI
        layer_groups = context.get('layer_groups')
        ndvi_layer_group = map_manager.build_layer_group(
            id='ndvi-layer', display_name='Vegetation Fraction', layers=layers
        )
        layer_groups.append(ndvi_layer_group)

        context.update(
            {
                'map_view': map_view,
                'layer_groups': layer_groups,
                'ndvi_threshold': ndvi_threshold,
                'extent': naip_viz['extent'],
                'ndvi_median': ndvi_median,
                'ndvi_max': ndvi_max
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
        # Get the ndvi slider value from POST params
        ndvi_threshold = request.POST.get('ndvi-threshold', None)

        # Update the ndvi_threshold parameter
        step.set_parameter('ndvi_threshold', float(ndvi_threshold))
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
