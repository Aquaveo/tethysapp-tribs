"""
********************************************************************************
* Name: manage_resource_delete_mixin.py
* Author: EJones
* Created On: Aug 29, 2023
* Copyright: (c) Aquaveo 2023
********************************************************************************
"""
import os
import logging
import shutil
from pathlib import Path
from threading import Thread

from django.http import JsonResponse
from tethys_sdk.permissions import permission_required
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from tribs_adapter.resources import Project, Scenario, Realization, Dataset
from tribs_adapter.services.tribs_spatial_manager import TribsSpatialManager

from tethysapp.tribs.app import Tribs as app

log = logging.getLogger(__name__)


class ManageResourceDeleteMixin:
    @permission_required('delete_resource')
    def _handle_delete(self, request, resource_id):
        """
        Handle delete user requests.
        """
        session = None
        json_response = {'success': True}
        try:
            _Resource = self.get_resource_model()
            make_session = self.get_sessionmaker()
            session = make_session()
            resource = session.query(_Resource).get(resource_id)
            resource.set_status(resource.ROOT_STATUS_KEY, resource.STATUS_DELETING)
            session.commit()
            delete_thread = Thread(
                target=self.delete_resource_artifacts,
                args=(request, resource.id, session.get_bind().url),
                daemon=True,
            )
            delete_thread.start()
        except Exception as e:
            json_response = {'success': False, 'error': repr(e)}
            log.exception(f'An unexpected error occurred while trying to delete resource with ID "{resource_id}": {e}')

        session is not None and session.close()
        return JsonResponse(json_response)

    def delete_resource_artifacts(self, request, resource_id, session_url):
        """
        Delete all Resource artifacts.

        Args:
            request(django.Request): the DELETE request object.
            resource(Resource): the resource that is being deleted.
        """
        session = sessionmaker(bind=create_engine(session_url))()
        resource = session.query(self._Resource).get(resource_id)
        log.info(f'Deleting artifacts for {resource}...')

        try:
            self.remove_visualizations(request, resource, session)
            self.delete_resource_files(request, resource)
            self.delete_filedatabase_artifacts(request, resource)
            self.delete_condor_jobs(request, resource)
            self.delete_children(resource)

            session.delete(resource)
            session.commit()
        except Exception as e:
            session.rollback()
            log.exception(f'An unexpected error occurred while trying to delete {resource}: {e}')

        # Fix CWD if it was deleted during this operation
        self.validate_cwd()

        log.info(f'Completed deleting artifacts for {resource}.')

    def delete_resource_files(self, request, resource):
        """
        Delete files and folders in workspaces associated with this resource.

        Args:
            request(django.Request): the DELETE request object.
            resource: the resource that is being deleted.
        """
        log.info(f'Deleting resource files for {resource}...')

        # Remove workspace artifacts
        try:
            files = resource.get_attribute('files', [])

            if resource.type == Project.TYPE:
                for dataset in resource.datasets:
                    files.extend(dataset.get_attribute('files', []))

                for scenario in resource.scenarios:
                    files.extend(scenario.get_attribute('files', []))

                    for realization in scenario.realizations:
                        files.extend(realization.get_attribute('files', []))

            elif resource.type == Scenario.TYPE:
                for dataset in resource.linked_datasets:
                    files.extend(dataset.get_attribute('files', []))

                for realization in resource.realizations:
                    files.extend(realization.get_attribute('files', []))

            elif resource.type == Realization.TYPE:
                for dataset in resource.linked_datasets:
                    files.extend(dataset.get_attribute('files', []))

            if not files:
                raise RuntimeError(f'No files found for {resource}.')

            self.delete_workspace_artifacts(request, files)

        except Exception:  # noqa: E722
            log.exception('An error occurred while trying to delete the workspace artifacts.')

        log.info(f'Completed deleting resource files for {resource}.')

    @staticmethod
    def delete_workspace_artifacts(request, workspace_artifact):
        """
        Deletes files and directories in workspace.

        Args:
            request(django.Request): the DELETE request object.
            workspace_artifact: list of files and directories to delete.
        """
        _, app_workspace = os.path.split(app.get_app_workspace().path)
        _, user_workspace = os.path.split(app.get_user_workspace(request).path)

        for wa in workspace_artifact:
            # Identify which workspace the file is in
            if app_workspace in wa:
                workspace_path = app_workspace
            elif user_workspace in wa:
                workspace_path = user_workspace
            else:
                log.warning(f'Skipping "{wa}" because it is not in a workspace.')
                continue

            # Find the base path within the workspace
            basename = ''

            while wa and not wa.endswith(workspace_path):
                wa, basename = os.path.split(wa)

            artifact_to_delete = os.path.join(wa, basename)

            # Ensure the base path is not one of the workspace directories
            parts = [a for a in artifact_to_delete.split(os.path.sep) if a != '']

            if parts and parts[-1] == workspace_path:
                log.warning(f'Skipping "{wa}" because it is a workspace.')
                continue

            # Handle the delete
            if os.path.isdir(artifact_to_delete):
                log.info(f'Deleting directory: "{artifact_to_delete}"')
                shutil.rmtree(artifact_to_delete)

            elif os.path.isfile(artifact_to_delete):
                log.info(f'Deleting file: "{artifact_to_delete}"')
                os.remove(artifact_to_delete)

            else:
                log.warning(f'Skipping "{wa}" because it does not exist.')

    @staticmethod
    def validate_cwd():
        # Fix issues with current working directory after deleting
        try:
            os.getcwd()
        except FileNotFoundError:
            app_dir = Path(__file__).parent.parent.parent
            log.warning(f'Invalid current working directory, changing to: {app_dir}')
            os.chdir(app_dir)

    def delete_condor_jobs(self, request, resource):
        """
        Delete condor jobs associated with TribsScenarioResource (e.g.: upload job, workflow jobs).

        Args:
            request(django.Request): the DELETE request object.
            resource(TribsScenarioResource): the resource that is being deleted.
        """
        log.info(f'Deleting condor jobs for {resource}...')

        # Remove condor artifacts
        try:
            job_manager = app.get_job_manager()
            resource_jobs = job_manager.list_jobs(filters={'extended_properties__contains': str(resource.id)})
            job_workspaces = [os.path.dirname(j.workspace) for j in resource_jobs]
            resource_jobs.delete()
            if job_workspaces:
                self.delete_workspace_artifacts(request, job_workspaces)
            log.info(f'Completed deleting condor jobs for {resource}.')
        except Exception:  # noqa: E722
            log.exception('An error occurred while trying to delete condor artifacts.')

    def delete_children(self, resource):
        """
        Delete all child resources of the given resource.

        Args:
            resource(Resource): the resource that is being deleted.
            session(sqlalchemy.session): open sqlalchemy session.
        """
        try:
            if isinstance(resource, (Project, Scenario, Realization)):
                log.info(f'Deleting child resources for {resource}...')
                resource.delete_children()
                log.info(f'Completed deleting child resources for {resource}.')
        except Exception:
            log.exception(f'An error occurred while trying to delete the children of {resource}.')

    @staticmethod
    def delete_filedatabase_artifacts(request, resource):
        """
        Delete the project database of Projects or file collection of Datasets.

        Args:
            request(django.Request): the DELETE request object.
            resource(TribsProjectResource): the resource that is being deleted.
        """
        log.info(f'Deleting file database for {resource}...')

        try:
            if resource.type == Project.TYPE:
                # Remove project database (which removes all dataset file collections too)
                resource.file_database_client.delete()

            elif resource.type == Dataset.TYPE:
                # Remove file collection for this dataset
                resource.file_collection_client.delete()

            elif resource.type == Scenario.TYPE:
                # Remove file collections for all linked datasets
                for dataset in resource.linked_datasets:
                    dataset.file_collection_client.delete()

                for realization in resource.realizations:
                    for dataset in realization.linked_datasets:
                        dataset.file_collection_client.delete()

            elif resource.type == Realization.TYPE:
                # Remove file collections for all linked datasets
                for dataset in resource.linked_datasets:
                    dataset.file_collection_client.delete()

            log.info(f'Completed deleting file database artifacts for {resource}.')

        except Exception:  # noqa: E722
            log.exception('An error occurred while trying to delete the file database.')

    def remove_visualizations(self, request, resource, session):
        """
        Delete visualizations associated with the resource.

        Args:
            request(django.Request): the DELETE request object.
            resource: the resource that is being deleted.
        """
        gs_engine = app.get_spatial_dataset_service(app.GEOSERVER_NAME, as_engine=True)
        spatial_manager = TribsSpatialManager(gs_engine)
        try:
            log.info(f'Deleting visualizations for {resource}...')
            if resource.type == Project.TYPE:
                for dataset in resource.datasets:
                    dataset.remove_visualization(session, spatial_manager)

            elif resource.type == Dataset.TYPE:
                resource.remove_visualization(session, spatial_manager)

            elif resource.type == Scenario.TYPE:
                for dataset in resource.linked_datasets:
                    dataset.remove_visualization(session, spatial_manager)

                for realization in resource.realizations:
                    for dataset in realization.linked_datasets:
                        dataset.remove_visualization(session, spatial_manager)

            elif resource.type == Realization.TYPE:
                for dataset in resource.linked_datasets:
                    dataset.remove_visualization(session, spatial_manager)

            log.info(f'Completed deleting visualizations for {resource}.')
        except Exception:  # noqa: E722
            log.exception(f'An error occurred while trying to delete the visualziations for {resource}.')
