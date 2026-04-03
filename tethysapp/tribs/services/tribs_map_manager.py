"""
********************************************************************************
* Name: map_manager
* Author: nswain
* Created On: August 30, 2018
* Copyright: (c) Aquaveo 2018
********************************************************************************
"""

import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from tethys_gizmos.gizmo_options import MapView, MVView
from tethysext.atcore.services.map_manager import MapManagerBase
from tribs_adapter.resources.project import Project

from tethysapp.tribs.app import Tribs as app

log = logging.getLogger(__name__)


class TribsMapManager(MapManagerBase):
    """
    Object that orchestrates the map layers and resources for tRIBS app.
    """

    MAP_VIEW_VERSION = "4.6.5"
    MAX_ZOOM = 28
    MIN_ZOOM = 4
    DEFAULT_ZOOM = 13

    LND_DISPLAY_NAMES = {
        "cdp": "Channel Depth",
        "cdq": "Channel Discharge",
        "cst": "Channel Stage",
        "cvl": "Channel Velocity",
    }

    def get_map_preview_url(self):
        """
        Get url for map preview image.

        Returns:
            str: preview image url.
        """
        # Default image url
        layer_preview_url = None

        try:
            extent = self.map_extent

            # Calculate preview layer height and width ratios
            if extent:
                # Calculate image dimensions
                long_dif = abs(extent[0] - extent[2])
                lat_dif = abs(extent[1] - extent[3])
                hw_ratio = float(long_dif) / float(lat_dif)
                max_dim = 300

                if hw_ratio < 1:
                    width_resolution = int(hw_ratio * max_dim)
                    height_resolution = max_dim
                else:
                    height_resolution = int(max_dim / hw_ratio)
                    width_resolution = max_dim

                wms_endpoint = self.spatial_manager.get_wms_endpoint()

                layer_preview_url = (
                    "{}?"
                    "service=WMS&"
                    "version=1.1.0&"
                    "request=GetMap&"
                    #  'layers={},{}&'
                    #  'styles={},{}&'
                    "bbox={},{},{},{}&"
                    "width={}&"
                    "height={}&"
                    "srs=EPSG:4326&"
                    "format=image%2Fpng"
                ).format(
                    wms_endpoint,
                    #   model_boundary_layer, stream_layer,
                    #   model_boundary_style, stream_style,
                    extent[0],
                    extent[1],
                    extent[2],
                    extent[3],
                    width_resolution,
                    height_resolution,
                )
        except Exception:
            log.exception("An error occurred while trying to generate the preview image.")

        return layer_preview_url

    def compose_map(self, request, resource_id, scenario_id, *args, **kwargs):
        """
        Compose the MapView object.

        Args:
            scenario_id (int): ID of the scenario.

        Returns:
            MapView, 4-list, list: The MapView, map extent, and layer groups.
        """
        # Get endpoint
        _ = self.get_wms_endpoint()

        # Get default view and extent for model
        view, model_extent = self.get_map_extent()

        map_layers = []
        layer_groups = []
        map_view = MapView(
            height="600px",
            width="100%",
            controls=["ZoomSlider", "Rotate", "FullScreen"],
            layers=[],
            view=MVView(
                projection="EPSG:4326",
                center=self.DEFAULT_CENTER,
                zoom=13,
                maxZoom=28,
                minZoom=4,
            ),
            basemap=[
                "ESRI",
                "OpenStreetMap",
            ],
            legend=True,
        )

        boundary_layers = []
        boundary_layer = self.compose_project_boundary_layer(project_id=resource_id, layer_variable="project_boundary")
        boundary_layers.append(boundary_layer)
        map_layers.extend(boundary_layers)

        map_view.layers.extend(map_layers)

        model_extent = boundary_layer.legend_extent
        return map_view, model_extent, layer_groups

    def compose_project_boundary_layer(self, project_id, layer_variable="", selectable=False, visible=True):
        """
        Compose layer object for the model boundary layer.

        Args:
            endpoint (str): URL of geoserver wms service.
            scenario_id (int): ID of the scenario.
        Returns:
            MVLayer: layer object.
        """
        # Compose layer name
        layer_name = str(project_id) + "_project_boundary"

        resource_db_session = None
        project = None
        try:
            resource_db_engine = create_engine(app.get_persistent_store_database(app.DATABASE_NAME, as_url=True))
            make_resource_db_session = sessionmaker(bind=resource_db_engine)
            resource_db_session = make_resource_db_session()
            project = resource_db_session.query(Project).get(project_id)
        finally:
            resource_db_session and resource_db_session.close()

        extents_with_buffer = self.spatial_manager.get_extent_for_project(project=project, buffer=0.1)
        extents = self.spatial_manager.get_extent_for_project(project=project)

        extents_geometry = {
            "type":
                "Polygon",
            "coordinates":
                [
                    [
                        [extents[0], extents[1]],
                        [extents[0], extents[3]],
                        [extents[2], extents[3]],
                        [extents[2], extents[1]],
                        [extents[0], extents[1]],
                    ]
                ],
        }
        geojson = {
            "type": "FeatureCollection",
            "name": str(project.id),
            "properties": {},
            "crs": {
                "type": "name",
                "properties": {
                    "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
                },
            },
            "features": [{
                "type": "Feature",
                "properties": {},
                "geometry": extents_geometry
            }],
        }

        # Compose layer
        layer = self.build_geojson_layer(
            geojson=geojson,
            layer_name=layer_name,
            layer_title=str(project.id),
            layer_variable=layer_variable,
            layer_id=str(project.id),
            selectable=selectable,
            has_action=selectable,
            popup_title="Project Boundary" if selectable else None,
            extent=extents_with_buffer,
            visible=visible,
        )
        return layer

    def get_plot_for_layer_feature(self, layer_name, feature_id):
        """
        Get plot data for given feature on given layer.

        Args:
            layer_name(str): Name/id of layer.
            feature_id(str): PostGIS Feature ID of feature.

        Returns:
            str, list<dict>, dict: plot title, data series, and layout options, respectively.
        """
        # TODO: FINISH DEFAULT IMPLEMENTATION USE FEATURE ID IN POSTGIS QUERY TO FIND MATCHING ID IN DATABASE
        # TODO: TEST THIS AFTER IMPLEMENTED
        title = "Fake Plot"
        layout = {"xaxis": {"title": layer_name}, "yaxis": {"title": "Value (units)"}}

        series1 = {
            "name": feature_id + "1",
            "mode": "lines",
            "x": [1, 2, 3, 4],
            "y": [10, 15, 13, 17],
        }

        series2 = {
            "name": feature_id + "2",
            "mode": "lines",
            "x": [1, 2, 3, 4],
            "y": [15, 20, 8, 12],
        }

        data = [series1, series2]

        return title, data, layout
