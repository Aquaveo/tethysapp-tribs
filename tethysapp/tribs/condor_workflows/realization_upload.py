"""
********************************************************************************
* Name: scenario_upload
* Author: EJones, nswain
* Created On: Aug 30, 2023
* Copyright: (c) Aquaveo 2023
********************************************************************************
"""
import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from tethys_sdk.jobs import CondorWorkflowJobNode
from tribs_adapter.resources import Realization
from tribs_adapter.workflows.utilities import get_condor_env
from tethysapp.tribs.app import Tribs as app


class RealizationUploadWorkflow(object):
    """
    Helper class that prepares and submits the new scenario upload jobs and workflow.
    """
    WORKFLOW_ID = 'upload'

    def __init__(
        self,
        user,
        workflow_name,
        workspace_path,
        input_archive_path,
        srid,
        resource_db_url,
        resource_id,
        resource_type,
        project_id,
        scenario_id,
        gs_engine=None,
    ):
        """
        Constructor.

        Args:
            user(auth.User): Django user.
            workflow_name(str): Name of the job.
            workspace_path(str): Path to workspace to be used by job.
            input_archive_path(str): Path to input zip archive.
            srid(int): Spatial Reference Identifier (e.g. 4236).
            resource_db_url(str): SQLAlchemy url to Resource database.
            resource_id(str): ID of associated resource.
            project_id(str): ID of associated project.
            scenario_id(str): ID of associated scenario.
            gs_engine(GeoServerSpatialDatasetSerivcesEngine): GeoServer connection object.
        """  # noqa: E501
        self.user = user
        self.job_name = workflow_name
        self.safe_job_name = ''.join(s if s.isalnum() else '_' for s in self.job_name)  #: Safe name with only A-Z 0-9
        self.workspace_path = workspace_path
        self.input_archive_path = input_archive_path
        self.srid = srid
        self.resource_db_url = resource_db_url
        self.resource_id = resource_id
        self.resource_type = resource_type
        self.project_id = project_id
        self.scenario_id = scenario_id
        self.gs_engine = gs_engine
        self.workflow = None
        self.job_manager = app.get_job_manager()
        self.scheduler = app.get_scheduler(app.SCHEDULER_NAME)
        self.job_executables_dir = Path(__file__).resolve().parent / 'executables'

    def prepare(self):
        """
        Prepares all workflow jobs for processing upload to database.
        """
        # Set parameters for HTCondor job
        self.workflow = self.job_manager.create_job(
            name=self.safe_job_name,
            user=self.user,
            job_type='CONDORWORKFLOW',
            max_jobs={'geoserver': 1},
            workspace=self.workspace_path,
            scheduler=self.scheduler
        )
        self.workflow.save()

        condor_env = get_condor_env()
        input_archive_filename = os.path.basename(self.input_archive_path)

        # upload_scenario_job
        upload_executable = 'upload_realization_exe.py'
        upload_scenario_job = CondorWorkflowJobNode(
            name='upload_realization',
            workflow=self.workflow,
            condorpy_template_name='vanilla_transfer_files',
            remote_input_files=(str(self.job_executables_dir / upload_executable), self.input_archive_path),
            attributes=dict(
                executable=upload_executable,
                transfer_input_files=(f'../{input_archive_filename}', ),
                arguments=(
                    self.resource_db_url,
                    self.project_id,
                    self.scenario_id,
                    self.resource_id,
                    input_archive_filename,
                    self.srid,
                    self.gs_engine.endpoint,
                    self.gs_engine.public_endpoint,
                    self.gs_engine.username,
                    self.gs_engine.password,
                    Realization.UPLOAD_STATUS_KEY,
                ),
                environment=condor_env,
            ),
        )
        upload_scenario_job.save()

        # update_status_job
        status_executable = 'update_status_exe.py'
        update_status_job = CondorWorkflowJobNode(
            name='finalize',
            workflow=self.workflow,
            condorpy_template_name='vanilla_transfer_files',
            remote_input_files=(str(self.job_executables_dir / status_executable), self.input_archive_path),
            attributes=dict(
                executable=status_executable,
                transfer_input_files=(f'../{input_archive_filename}', ),
                arguments=(
                    'upload',
                    self.resource_db_url,
                    self.resource_id,
                    self.resource_type,
                ),
                environment=condor_env,
            ),
        )
        update_status_job.save()

        # set relationships
        update_status_job.add_parent(upload_scenario_job)

        # add resource id to extended properties for filtering
        self.workflow.extended_properties['resource_id'] = str(self.resource_id)
        self.workflow.save()

    def run_job(self):
        """
        Executes the prepared job.
        """
        resource_db_session = None

        try:
            resource_db_engine = create_engine(self.resource_db_url)
            make_resource_db_session = sessionmaker(bind=resource_db_engine)
            resource_db_session = make_resource_db_session()
            resource = resource_db_session.query(Realization).get(self.resource_id)

            resource.set_status(Realization.ROOT_STATUS_KEY, Realization.STATUS_PENDING)
            resource_db_session.commit()

            self.prepare()
            self.workflow.execute()
        finally:
            resource_db_session and resource_db_session.close()
