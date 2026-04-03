"""
********************************************************************************
* Name: modify_tribs_dataset.py
* Author: EJones
* Created On: Aug 29, 2023
* Copyright: (c) Aquaveo 2023
********************************************************************************
"""
import os
from os import listdir
from os.path import join
import logging
import tempfile
import zipfile
import pathlib
from django.contrib import messages
from tethys_sdk.workspaces import get_user_workspace
from tethysext.atcore.controllers.app_users import ModifyResource
from tethysext.atcore.exceptions import ATCoreException

from tethysapp.tribs.app import Tribs as app
from tethys_sdk.gizmos import SelectInput
from tribs_adapter.resources.project import Project
from tribs_adapter.resources.scenario import Scenario
from tribs_adapter.common.dataset_types import DatasetTypes
from tribs_adapter.services.upload import UploadDatasetWorkflow
from tribs_adapter.services.tribs_spatial_manager import TribsSpatialManager

__all__ = ['ModifyTribsDataset']
log = logging.getLogger('tribs')


class ModifyTribsDataset(ModifyResource):
    """
    Controller that handles the new and edit pages for tRibs dataset resources.
    """
    template_name = 'tribs/modify_dataset.html'

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
    file_upload_label = "Dataset Files"
    file_upload_help = "Upload an archive containing the dataset files."
    file_upload_error = "Must provide dataset file(s)."

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

        # Set the dataset type
        select_type = request.POST.get('select_type')

        session.commit()

        # Need to get the selected project
        project = session.query(Project).get(select_project) if select_project else None
        if project is None:
            messages.error(request, 'An unexpected error occured while initializing your dataset.')
            raise ATCoreException(f'Unable to find the selected project while initializing {resource}.')
        # Need to get the selected scenario
        scenario = session.query(Scenario).get(select_scenario) if select_scenario else None
        if select_scenario and scenario is None:
            messages.error(request, 'An unexpected error occured while initializing your dataset.')
            raise ATCoreException(f'Unable to find the selected scenario while initializing {resource}.')

        dataset_type = DatasetTypes[select_type.upper()]

        # Only do the following if creating a new dataset
        if not editing:
            dataset_files = resource.get_attribute('files')
            if len(dataset_files) == 0:
                messages.error(request, 'An unexpected error occured while initializing your dataset.')
                raise ATCoreException(f'Files were not found while initializing {resource}.')

            file_path = pathlib.Path(dataset_files[0])
            ext = file_path.suffix

            if ext == ".zip":
                # Use a temporary directory to unzip our data and extract the
                with tempfile.TemporaryDirectory(dir=app.get_app_workspace().path) as temp_path:

                    unzip_path = os.path.join(temp_path, 'unzip')
                    os.makedirs(unzip_path)

                    with zipfile.PyZipFile(file_path, 'r') as zObject:
                        # Extracting all the members of the zip into a specific location.
                        zObject.extractall(path=unzip_path)
                        dataset_files = [join(unzip_path, f) for f in listdir(unzip_path)]
                        if len(dataset_files) == 0:
                            dataset_files = None

                    if dataset_files is None:
                        messages.error(
                            request, 'Could not find files in uploaded zip archive while initializing your dataset.'
                        )
                        raise ATCoreException(
                            'Could not find files in uploaded zip '
                            f'archive while initializing {resource}.'
                        )

                    # Define additional job parameters
                    gs_engine = app.get_spatial_dataset_service(app.GEOSERVER_NAME, as_engine=True)

                    #  Init the dataset and add it to the project
                    resource.init(
                        project=project,
                        link=scenario,
                        dataset_type=dataset_type,
                        srid=resource.get_attribute('srid'),
                        items=dataset_files,
                        relative_to=unzip_path
                    )

                    user_workspace_path = get_user_workspace(app, request).path
                    job_path = os.path.join(user_workspace_path, str(resource.id))
                    srid = resource.get_attribute('srid')

                    # Create job directory if it doesn't exist already
                    if not os.path.exists(job_path):
                        os.makedirs(job_path)

                    # Create the condor job and submit
                    scheduler_name = app.get_scheduler(app.SCHEDULER_NAME)
                    job = UploadDatasetWorkflow(
                        app=app,
                        user=request.user,
                        workflow_name=resource.name,
                        workspace_path=job_path,
                        resource_db_url=app.get_persistent_store_database(app.DATABASE_NAME, as_url=True),
                        resource=resource,
                        scheduler=scheduler_name,
                        job_manager=app.get_job_manager(),
                        spatial_manager=TribsSpatialManager,
                        srid=srid,
                        gs_engine=gs_engine,
                        status_keys=[]  # DO NOT REMOVE
                    )

                    job.run_job()
                    log.info('DATASET UPLOAD job submitted to HTCondor')

        else:
            resource.project = project
            resource.dataset_type = select_type
            # Reset linked scenarios
            for s in resource.linked_scenarios:
                resource.remove_link(s)
            if scenario is not None:
                resource.add_link(scenario)

        # Save changes/new dataset
        session.commit()

    def validate_custom_fields(
        self,
        params,
        session=None,
        request=None,
        request_app_user=None,
    ):
        # project, scenario, dataset type
        project_id = None
        scenario_id = None
        dataset_type = None

        project_id = params.get('select_project', None)
        scenario_id = params.get('select_scenario', None)
        dataset_type = params.get('select_type', None)

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

            project = session.query(Project).get(project_id) if project_id else None
            scenario = session.query(Scenario).get(scenario_id) if scenario_id else None

            project_resources = self.query_resource(session, request, request_app_user, Project)
            scenario_resources = self.query_resource(session, request, request_app_user, Scenario)

            select_project_error = ""
            if project is None or project not in project_resources:
                is_valid = False
                select_project_error = "Could not find a project with the given ID."

            select_scenario_error = ""
            if project and scenario is not None and scenario not in project.scenarios:
                is_valid = False
                select_scenario_error = "The selected scenario does not belong to the selected project."

            dataset_type_error = ""
            if dataset_type is None or dataset_type not in [d.value for d in DatasetTypes]:
                is_valid = False
                dataset_type_error = "Could not find the dataset type in the supported dataset types."

            # Update and return context
            context = {
                'project': project,
                'scenario': scenario,
                'dataset_type': dataset_type,
                'project_resources': project_resources,
                'scenario_resources': scenario_resources,
                'select_project_error': select_project_error,
                'select_scenario_error': select_scenario_error,
                'dataset_type_error': dataset_type_error
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
        if editing and resource:
            project = resource.project
            scenario = resource.linked_scenarios[0] if len(resource.linked_scenarios) else None
            dataset_type = resource.dataset_type
        else:
            project = context.get('project', None)
            scenario = context.get('scenario', None)
            dataset_type = context.get('dataset_type', None)

        init_project = None
        init_scenario = None
        if project is not None:
            init_project = project
        if scenario is not None:
            init_scenario = scenario

        scenarios_params = [('None', "")]
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
            projects_params.append((name, str(value)))

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
            scenarios_params.append((scenario.name, str(scenario.id)))

        # Select Project
        select_project_error = context.get('select_project_error', '')
        select_project = SelectInput(
            display_text="Assign to Project",
            name="select_project",
            options=projects_params,
            initial=str(init_project.id) if init_project else None,
            error=select_project_error,
        )

        # Select Scenario
        select_scenario_error = context.get('select_project_error', '')
        select_scenario = SelectInput(
            display_text="Link to Scenario (optional)",
            name="select_scenario",
            options=scenarios_params,
            initial=str(init_scenario.id) if init_scenario else None,
            error=select_scenario_error,
        )

        # Get Datatypes
        type_params = []
        for t in DatasetTypes:
            if t not in [DatasetTypes.DIRECTORY, DatasetTypes.UNKNOWN]:
                name = t.value.replace('_', ' ').title()
                type_params.append((name, t.value))
                if dataset_type is None:
                    dataset_type = t

        # Select dataset
        dataset_type_error = context.get('dataset_type_error', '')
        select_type = SelectInput(
            display_text="Dataset Type",
            name="select_type",
            options=type_params,
            initial=dataset_type,
            error=dataset_type_error,
        )

        return {
            'project': project,
            'scenario': scenario,
            'dataset_type': dataset_type,
            'select_project': select_project,
            'select_scenario': select_scenario,
            'select_type': select_type,
            'projects_and_scenarios': projects_and_scenarios
        }
