"""
********************************************************************************
* Name: modify_tribs_scenario.py
* Author: EJones
* Created On: Aug 29, 2023
* Copyright: (c) Aquaveo 2023
********************************************************************************
"""
import logging
from pathlib import Path

from django.contrib import messages
from tethys_sdk.gizmos import SelectInput
from tethysext.atcore.controllers.app_users import ModifyResource
from tethysext.atcore.exceptions import ATCoreException

from tribs_adapter.resources.project import Project
from tethysapp.tribs.app import Tribs as app
from tethysapp.tribs.condor_workflows.scenario_upload import ScenarioUploadWorkflow

__all__ = ['ModifyTribsScenario']
log = logging.getLogger('tribs')


class ModifyTribsScenario(ModifyResource):
    """
    Controller that handles the new and edit pages for tRibs scenario resources.
    """
    template_name = 'tribs/modify_scenario.html'

    # Srid field options
    include_srid = True
    srid_required = True
    srid_default = ""
    srid_error = "Spatial reference is required."

    # File upload options
    include_file_upload = True
    file_upload_required = True
    file_upload_multiple = False
    file_upload_accept = ".zip"
    file_upload_label = "tRIBS Files"
    file_upload_help = "Upload an archive containing the tRIBS scenario input files."
    file_upload_error = "Must provide file(s)."

    def handle_resource_finished_processing(self, session, request, request_app_user, resource, editing, context):
        """
        Hook to allow for post processing after the resource has finished being created or updated.
        Args:
            session(sqlalchemy.session): open sqlalchemy session.
            request(django.request): the Django request.
            request_app_user(AppUser): app user that is making the request.
            resource(Resource): The resource being edited or newly created.
            editing(bool): True if editing, False if creating a new resource.
        """
        select_project = request.POST.get('select_project')

        result = session.query(Project).filter(Project.id == select_project)
        project = None
        for single_result in result:
            project = single_result
        if project is None:
            messages.error(request, 'Could not find files in uploaded zip archive while initializing your scenario.')
            raise ATCoreException(f'Could not find the selected project while initializing {resource}.')

        if editing:
            resource.project = project
            session.commit()

        # Only do the following if creating a new scenario
        if not editing:
            # Get the uploaded zip file
            zip_file = resource.get_attribute('files')[0]

            # Define additional job parameters
            gs_engine = app.get_spatial_dataset_service(app.GEOSERVER_NAME, as_engine=True)
            srid = resource.get_attribute('srid')

            # Prepare condor job for processing file upload
            user_workspace = app.get_user_workspace(request.user)
            user_workspace_path = Path(user_workspace.path)
            job_path = user_workspace_path / str(resource.id)
            job_path.mkdir(exist_ok=True, parents=True)

            # Create the condor job and submit
            job = ScenarioUploadWorkflow(
                user=request.user,
                workflow_name=resource.name,
                workspace_path=str(job_path),
                input_archive_path=zip_file,
                srid=srid,
                resource_db_url=app.get_persistent_store_database(app.DATABASE_NAME, as_url=True),
                resource_id=str(resource.id),
                resource_type=resource.type,
                project_id=str(project.id),
                gs_engine=gs_engine,
            )

            job.run_job()
            log.info('SCENARIO BULK UPLOAD job submitted to HTCondor')

        # Save new scenario
        session.commit()

    def validate_custom_fields(self, params, session=None, request=None, request_app_user=None):
        # gauge type, gauge ID, Stream level datum, High-level alarm, Latitude, Longitude
        project = None

        project = params.get('project')

        # Do validation:
        is_valid = True

        # Update and return context
        context = {'project': project}
        return is_valid, context

    def initialize_custom_fields(self, session, request, resource, editing, context):
        """
        Hook to allow for initializing custom fields
        """
        init = None
        if editing and resource:
            init = resource.project

        # Get all projects
        make_session = super().get_sessionmaker()
        session = make_session()
        _AppUser = self.get_app_user_model()
        request_app_user = _AppUser.get_app_user_from_request(request, session)
        model_resources = request_app_user.get_resources(
            session=session,
            request=request,
            of_type=Project,
            include_children=False,
        )
        projects_params = []
        for project in model_resources:
            name = project.name
            value = project.id
            projects_params.append((name, value))
            if init is None:
                init = value

        select_project = SelectInput(
            display_text="Select project",
            name="select_project",
            options=projects_params,
            initial=init,
            original=True,
        )

        return {'select_project': select_project}
