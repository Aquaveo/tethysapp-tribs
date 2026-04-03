"""
********************************************************************************
* Name: modify_tribs_realization.py
* Author: EJones, nswain
* Created On: Oct 19, 2023
* Copyright: (c) Aquaveo 2023
********************************************************************************
"""
import logging
from pathlib import Path
from django.contrib import messages
from tethys_sdk.gizmos import SelectInput
from tethysext.atcore.controllers.app_users import ModifyResource
from tethysext.atcore.exceptions import ATCoreException

from tethysapp.tribs.app import Tribs as app
from tribs_adapter.resources import Project, Scenario
from tethysapp.tribs.condor_workflows.realization_upload import RealizationUploadWorkflow

__all__ = ['ModifyTribsRealization']
log = logging.getLogger('tribs')


class ModifyTribsRealization(ModifyResource):
    """
    Controller that handles the new and edit pages for tRibs realization resources.
    """
    template_name = 'tribs/modify_realization.html'

    # Srid field options
    include_srid = False  # Spatial Reference ID

    # File upload options
    include_file_upload = True
    file_upload_required = True
    file_upload_multiple = False
    file_upload_accept = ".zip"
    file_upload_label = "tRIBS Files"
    file_upload_help = "Upload an archive containing a tRIBS model with output files."
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
            contex(dict): Template context variables for the view.
        """
        # Set the project
        select_project = request.POST.get('select_project')

        # Set the scenario
        select_scenario = request.POST.get('select_scenario')

        session.commit()

        # Need to get the selected project
        project = session.query(Project).get(select_project)
        if project is None:
            messages.error(request, 'An unexpected error occured while initializing your realization.')
            raise ATCoreException(f'Unable to find the selected project while initializing {resource}.')
        # Need to get the selected scenario
        scenario = session.query(Scenario).get(select_scenario)
        if scenario is None:
            messages.error(request, 'An unexpected error occured while initializing your realization.')
            raise ATCoreException(f'Unable to find the selected scenario while initializing {resource}.')

        # Only do the following if creating a new realization
        if not editing:
            realization_files = resource.get_attribute('files')
            if len(realization_files) == 0:
                messages.error(request, 'An unexpected error occured while initializing your realization.')
                raise ATCoreException(f'Files were not found while initializing {resource}.')

            # Get the uploaded zip file
            zip_file = realization_files[0]

            # Define additional job parameters
            gs_engine = app.get_spatial_dataset_service(app.GEOSERVER_NAME, as_engine=True)

            # Set SRID to be same as the scenario
            srid = scenario.get_attribute('srid')
            resource.set_attribute('srid', srid)

            # Prepare condor job for processing file upload
            user_workspace = app.get_user_workspace(request.user)
            user_workspace_path = Path(user_workspace.path)
            job_path = user_workspace_path / str(resource.id)
            job_path.mkdir(exist_ok=True, parents=True)

            # Create the condor job and submit
            job = RealizationUploadWorkflow(
                user=request.user,
                workflow_name=resource.name,
                workspace_path=str(job_path),
                input_archive_path=zip_file,
                srid=srid,
                resource_db_url=app.get_persistent_store_database(app.DATABASE_NAME, as_url=True),
                resource_id=str(resource.id),
                resource_type=resource.type,
                project_id=str(project.id),
                scenario_id=str(scenario.id),
                gs_engine=gs_engine,
            )

            job.run_job()
            log.info('REALIZATION BULK UPLOAD job submitted to HTCondor')

        else:
            resource.scenario = scenario

        # Save changes/new realization
        session.commit()

    def validate_custom_fields(
        self,
        params,
        session=None,
        request=None,
        request_app_user=None,
    ):
        # project, scenario
        project_id = None
        scenario_id = None

        project_id = params.get('select_project', None)
        scenario_id = params.get('select_scenario', None)

        # Do validation:
        is_valid = True
        context = {}

        if request is not None:
            if session is None:
                make_session = super().get_sessionmaker()
                session = make_session()

            if request_app_user is None:
                _AppUser = self.get_app_user_model()
                request_app_user = _AppUser.get_app_user_from_request(request, session)

            project = session.query(Project).get(project_id)
            scenario = session.query(Scenario).get(scenario_id)

            project_resources = self.query_resource(session, request, request_app_user, Project)
            scenario_resources = self.query_resource(session, request, request_app_user, Scenario)

            select_project_error = ""
            if project is None or project not in project_resources:
                is_valid = False
                select_project_error = "Could not find a project with the given ID."

            select_scenario_error = ""
            if project and scenario not in project.scenarios:
                is_valid = False
                select_scenario_error = "The selected scenario does not belong to the selected project."

            # Update and return context
            context = {
                'project': project,
                'scenario': scenario,
                'project_resources': project_resources,
                'scenario_resources': scenario_resources,
                'select_project_error': select_project_error,
                'select_scenario_error': select_scenario_error,
            }
        else:
            is_valid = False

        return is_valid, context

    def query_resource(self, session, request, request_app_user, of_type):
        resources = request_app_user.get_resources(
            session=session,
            request=request,
            of_type=of_type,
            include_children=False,
        )
        return resources

    def initialize_custom_fields(self, session, request, resource, editing, context):
        """
        Hook to allow for initializing custom fields
        """
        project = None
        scenario = None

        if editing and resource:
            project = resource.project
            scenario = resource.scenario

        init_project = None
        init_scenario = None
        if project is not None:
            init_project = project
        if scenario is not None:
            init_scenario = scenario

        scenarios_params = []
        projects_and_scenarios = {}

        # Get all projects
        if 'project_resources' in context:
            project_resources = context['project_resources']
        else:
            _AppUser = self.get_app_user_model()
            request_app_user = _AppUser.get_app_user_from_request(request, session)
            project_resources = self.query_resource(session, request, request_app_user, Project)

        projects_params = []
        for project in project_resources:
            name = project.name
            value = project.id
            projects_params.append((name, value))

            scenarios = project.scenarios
            scenarios_simplified = {}
            for scenario in scenarios:
                scenarios_simplified[str(scenario.id)] = scenario.name
            projects_and_scenarios[str(project.id)] = scenarios_simplified

            if init_project is None:
                init_project = project
                if init_scenario is None and len(scenarios):
                    init_scenario = scenarios[0]

        for scenario in init_project.scenarios:
            scenarios_params.append((scenario.name, scenario.id))

        # Select Project
        select_project_error = context.get('select_project_error', '')
        select_project = SelectInput(
            display_text="Select project",
            name="select_project",
            options=projects_params,
            initial=init_project,
            original=True,
            error=select_project_error,
        )

        # Select Scenario
        select_scenario_error = context.get('select_project_error', '')
        select_scenario = SelectInput(
            display_text="Select scenario",
            name="select_scenario",
            options=scenarios_params,
            initial=init_scenario,
            original=True,
            error=select_scenario_error,
        )

        return {
            'project': project,
            'scenario': scenario,
            'select_project': select_project,
            'select_scenario': select_scenario,
            'projects_and_scenarios': projects_and_scenarios
        }
