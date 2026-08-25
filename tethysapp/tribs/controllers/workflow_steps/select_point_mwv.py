"""
********************************************************************************
* Name: select_point_mwv.py
* Author: Yue Sun
* Created On: Aug 20, 2026
* Copyright: (c) Aquaveo 2026
********************************************************************************
"""
import logging
from tethysext.atcore.controllers.resource_workflows.map_workflows.spatial_input_mwv import SpatialInputMWV
from tribs_adapter.resources.dataset import Dataset


log = logging.getLogger(f'tethys.{__name__}')


class SelectPointMWV(SpatialInputMWV):
    """
    Controller for selecting a point on the map in Delineate Hydrologic Features From Point workflow.
    """

    template_name = 'tribs/select_point_mwv.html'
    show_custom_layer = False

    #: Default colors of the raster_continuous SLD color map (color0-color10),
    #: used for entries the env string does not override.
    RASTER_CONTINUOUS_COLORS = [
        '#96D257', '#278C39', '#2A7B45', '#829C41', '#DBB82E', '#AE4818',
        '#842511', '#61370F', '#806346', '#C2C2C2', '#FFFFFF',
    ]

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

        form_values = previous_step.get_parameter('form-values')['value']
        dataset_id = form_values.get('input_raster')
        dataset = session.query(Dataset).get(dataset_id)
        viz = dataset.get_attribute('viz')

        map_manager = self.get_map_manager(request=request, resource=resource)
        # Create Input Raster Layer
        layer = map_manager.build_wms_layer(
            endpoint=viz['url'],
            layer_name=viz['layer'],
            layer_title=dataset.name,
            layer_id='input-raster',
            layer_variable='input_raster',
            extent=viz['extent'],
            style='raster_continuous',
            env=viz['env_str'],
            selectable=False,
        )

        map_view = context['map_view']
        map_view.layers.append(layer)

        # Tree-only entry for the drawing layer so it shows in the layer group.
        # Not added to map_view.layers: the actual features live on the map gizmo's
        # drawing layer, which select_point_mwv.js binds to this row's checkbox.
        # Title the row after the user-given point name, if any. select_point_mwv.js
        # hides the row until a point exists and keeps the label in sync.
        saved_features = (current_step.get_parameter('geometry') or {}).get('features') or []
        point_name = saved_features[0].get('properties', {}).get('point_name') if saved_features else None

        drawing_layer_item = map_manager.build_geojson_layer(
            geojson={'type': 'FeatureCollection', 'features': []},
            layer_name='drawing_layer',
            layer_title=point_name or current_step.options.get('singular_name', 'Point'),
            layer_variable='pour_point',
            layer_id='drawing_layer',
        )

        layer_groups = context.get('layer_groups')
        layer_group = map_manager.build_layer_group(
            id='input-raster-layer', display_name='Input Raster', layers=[drawing_layer_item, layer]
        )
        layer_groups.append(layer_group)

        # Remove the project boundary layer
        map_view.layers = [
            lyr for lyr in map_view.layers
            if lyr['data'].get('layer_variable') != 'project_boundary'
        ]

        # Zoom to the raster instead of the project boundary
        context['map_extent'] = viz['extent']

        # Stash the raster extent on the step so validate() can restrict input to it
        current_step.set_attribute('raster_extent', viz['extent'])
        session.commit()

        # Build the raster legend from the layer's env string
        context.update({
            'legend_title': dataset.name,
            'legend_divisions': self.build_raster_legend_divisions(viz.get('env_str', '')),
        })

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

    @classmethod
    def build_raster_legend_divisions(cls, env_str):
        """
        Build legend divisions from a WMS env string (e.g.: "val_no_data:-9999;val0:1519.85;val1:1538.36;...").
        Colors are read from the env string (color0, color1, ...) when present, otherwise the
        raster_continuous SLD default colors are used.

        Args:
            env_str(str): The env parameter string of the raster layer.

        Returns:
            list<dict<value,color>>: legend divisions, highest value first.
        """
        env = {}
        for pair in env_str.split(';'):
            if ':' in pair:
                key, value = pair.split(':', 1)
                env[key.strip()] = value.strip()

        divisions = []
        for i, default_color in enumerate(cls.RASTER_CONTINUOUS_COLORS):
            value = env.get(f'val{i}')
            if value is None:
                continue
            divisions.append({'value': value, 'color': env.get(f'color{i}', default_color)})

        # Show the highest value at the top of the legend
        return list(reversed(divisions))
