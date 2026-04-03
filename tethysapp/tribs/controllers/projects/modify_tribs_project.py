"""
********************************************************************************
* Name: modify_tribs_project.py
* Author: EJones
* Created On: Aug 29, 2023
* Copyright: (c) Aquaveo 2023
********************************************************************************
"""
import json
import logging
from django.contrib import messages

from tethys_sdk.gizmos import MapView, MVView, MVDraw
from tethysext.atcore.controllers.app_users import ModifyResource
from tethysext.atcore.exceptions import ATCoreException

__all__ = ['ModifyTribsProject']
log = logging.getLogger('tribs')


class ModifyTribsProject(ModifyResource):
    """
    Controller that handles the new and edit pages for tRibs project resources.
    """
    # Srid field options
    include_srid = False  # Spatial Reference ID

    # File upload options
    include_file_upload = False

    template_name = 'tribs/modify_project.html'

    def handle_resource_finished_processing(self, session, request, request_app_user, resource, editing, context):
        """
        Hook to allow for post processing after the resource has finished being created or updated.
        Args:
            session(sqlalchemy.session): open sqlalchemy session.
            request(django.request): the Django request.
            request_app_user(AppUser): app user that is making the request.
            resource(Resource): The resource (project) being edited or newly created.
            editing(bool): True if editing, False if creating a new resource.
        """
        # Only do the following if creating a new project
        if not editing:
            # Create a new project database
            try:
                resource.init()
            except Exception:
                messages.error(request, 'An unexpected error occured while initializing your project.')
                raise ATCoreException(f'An unexpected error occured while initializing {resource}.')

            # Set custom attributes
            resource.set_attribute('file_database_id', str(resource.file_database.id))

        # Validation is called before this, so no need to validate again
        project_extent_geometry_str = request.POST.get('geometry', '{}')

        # Calulate extent from geometry
        project_extent = None
        project_extent_geometry = self._safe_json_loads(project_extent_geometry_str)
        if project_extent_geometry:
            geometry = project_extent_geometry.get('geometries', [{}])[0]
            coordinates = geometry.get('coordinates', [[]])[0]
            lats = [c[1] for c in coordinates]
            lons = [c[0] for c in coordinates]
            # [minx, miny, maxx, maxy]
            project_extent = [min(lons), min(lats), max(lons), max(lats)]

        # Save to organization attributes
        resource.set_attribute('project_extent_geometry', str(project_extent_geometry_str))
        resource.set_attribute('project_extent', project_extent)

        # Save new project
        session.commit()

    def initialize_custom_fields(self, session, request, resource, editing, context):
        """
        Hook to allow for initializing custom fields.

        Args:
            session(sqlalchemy.session): open sqlalchemy session.
            request(django.request): the Django request.
            organization(Organization): The organization being created / edited.
            editing(bool): True if rendering form for editing.

        Returns:
            dict: Template context variables for defining custom fields (i.e. gizmos, initial values, etc.).
        """
        # Default values
        project_extent = None
        project_extent_geometry_str = None

        # Override default with values from database if editing
        if editing:
            project_extent_geometry_str = resource.get_attribute('project_extent_geometry', '{}')
            project_extent = resource.get_attribute('project_extent', project_extent)

        # Override value with most recent values submitted by user if applicable
        if request.POST and request.POST.get('geometry'):
            project_extent_geometry_str = request.POST.get('geometry')

        # Initialize Dashboard Extent Map Field
        if project_extent:
            # Use a slightly larger extent as the map extent
            buffer_factor = 0.1
            x_dist = project_extent[2] - project_extent[0]
            y_dist = project_extent[3] - project_extent[1]
            x_buff = x_dist * buffer_factor
            y_buff = y_dist * buffer_factor

            buffered_extent = [
                project_extent[0] - x_buff,
                project_extent[1] - y_buff,
                project_extent[2] + x_buff,
                project_extent[3] + y_buff,
            ]

            initial_view = MVView(
                extent=buffered_extent,
                maxZoom=18,
                minZoom=2,
            )
        else:
            initial_view = MVView(
                projection='EPSG:4326',
                center=[-98.585522, 39.833333],
                zoom=3.5,
                maxZoom=18,
                minZoom=2,
            )

        drawing_options = MVDraw(
            controls=['Pan', 'Delete', 'Modify', 'Move', 'Box'],
            output_format='GeoJSON',
            initial_features=project_extent_geometry_str,  # Initial values for drawing layer on map
        )

        map_controls = [
            {
                'MousePosition': {
                    'projection': 'EPSG:4326'
                }
            },
        ]

        basemaps = [
            'OpenStreetMap',
        ]

        project_extent_field = MapView(
            height='400px',
            width='100%',
            controls=map_controls,
            layers=[],
            draw=drawing_options,
            view=initial_view,
            basemap=basemaps,
        )

        # Add custom fields to the template context
        context = {
            'project_extent_field': project_extent_field,
            'project_extent': project_extent,
        }

        return context

    def _safe_json_loads(self, json_str):
        return json.loads(json_str) if json_str else {}
