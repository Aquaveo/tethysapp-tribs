import logging
import os
import re
import pandas as pd
import aioshutil
from pathlib import Path

from tribs_adapter.resources import Dataset
from tribs_adapter.resources.dataset import DatasetTypes
from ..backend_actions import BackendActions
from ..exc import LinkedDatasetError
from .resource_backend_handler import ResourceBackendHandler as RBH

log = logging.getLogger(__name__)


class DatasetBackendHandler(RBH):
    SEND_DATA_ACTION: BackendActions = BackendActions.DATASET_DATA
    UPDATABLE_PROPS: list[str] = ['name', 'description', 'attributes', 'public', 'status', 'dataset_type']
    READONLY_ATTRS = ['files', 'input_file', 'dataset_type', 'viz']

    @property
    def receiving_actions(self) -> dict[BackendActions, callable]:
        return {
            BackendActions.DATASET_CREATE: self.receive_create,
            BackendActions.DATASET_DATA: self.receive_data,
            BackendActions.DATASET_DELETE: self.receive_delete,
            BackendActions.DATASET_DUPLICATE: self.receive_duplicate,
            BackendActions.DATASET_GET_PIXEL_TIMESERIES: self.receive_czml_point_timeseries,
            BackendActions.DATASET_GET_MRF_OR_RFT_TIMESERIES: self.receive_mrf_or_rft_timeseries,
            BackendActions.DATASET_UPDATE: self.receive_update,
        }

    @RBH.action_handler
    async def receive_create(self, event, action, data, session):
        """Handle received create dataset messages."""
        project = await self.get_project(session)
        action_id = action.get('id')
        app_user = await self.get_app_user(session)

        # Locate files
        uploads_dir = await self.get_uploads_dir()
        action_uploads_dir = uploads_dir / action_id
        assert await action_uploads_dir.exists(
        ), f'Uploads directory for DATASET_CREATE action "{action_id}" does not exist.'
        items = [Path(f) async for f in action_uploads_dir.glob('*')]
        log.debug(f'Found {len(items)} files in action uploads directory: "{action_uploads_dir}"')

        def _new_dataset(session, app_user, name, description, project, dataset_type, srid, items, relative_to):
            created_by = app_user.username if app_user else 'unknown'
            organizations = app_user.organizations if app_user else []
            return Dataset.new(
                session=session,
                name=name,
                description=description,
                created_by=created_by,
                project=project,
                dataset_type=dataset_type,
                srid=srid,
                items=items,
                relative_to=relative_to,
                organizations=organizations,
            )

        new_dataset = await session.run_sync(
            _new_dataset,
            app_user=app_user,
            name=await self.make_unique(data.get('name'), Dataset, project),
            description=data.get('description'),
            project=project,
            dataset_type=Dataset.DatasetTypes(data.get('dataset_type', 'UNKNOWN')),
            srid=data.get('srid'),
            items=items,
            relative_to=action_uploads_dir,
        )

        # Clean-up action uploads directory
        log.debug(f'Cleaning up action uploads directory: "{action_uploads_dir}"')
        await aioshutil.rmtree(action_uploads_dir, ignore_errors=True)

        # Create viz
        await self._generate_visualization(session, action, new_dataset)

        log.debug(f'Created new dataset named: "{new_dataset.name}"')
        await self.send_data(session, new_dataset, action.get('id'))

    @RBH.action_handler
    async def receive_data(self, event, action, data, session):
        """Handle received get dataset messages."""
        dataset_id = data.get('id')
        dataset = await self.get_dataset(session, dataset_id)
        await self.send_data(session, dataset, action.get('id'))

    @RBH.action_handler
    async def receive_delete(self, event, action, data, session):
        """Handle received delete dataset messages."""
        dataset_id = data.get('id')
        log.debug(f'Deleting dataset with ID: "{dataset_id}"')
        dataset = await self.get_dataset(session, dataset_id)

        def _check_for_links(_, dataset):
            if dataset.linked_scenarios or dataset.linked_realizations:
                raise LinkedDatasetError(
                    f'Dataset "{dataset.name}" cannot be deleted because it is linked to one or more scenarios or realizations.',  # noqa: E501
                    dataset
                )

        await session.run_sync(_check_for_links, dataset)
        await self.set_status(session, dataset, dataset.STATUS_DELETING)
        await self.send_processing_progress(
            session=session,
            for_action=action,
            dataset=dataset,
            status=dataset.STATUS_PROCESSING,
            message=f'Deleting dataset "{dataset.name}", please wait.',
        )
        await self._delete_dataset(session, dataset)
        await self.send_processing_progress(
            session=session,
            for_action=action,
            dataset=dataset,
            status=dataset.STATUS_COMPLETE,
            message=f'Deleted dataset "{dataset.name}".',
        )
        log.debug(f'Deleted dataset with ID: "{dataset_id}"')
        await self.send_action(BackendActions.DATASET_DELETE, {"id": str(dataset_id)})

    @RBH.action_handler
    async def receive_duplicate(self, event, action, data, session):
        """Handle received duplicate dataset messages."""
        dataset_id = data.get('id')
        log.debug(f'Duplicating dataset with ID: "{dataset_id}"')
        project = await self.get_project(session)
        og_dataset = await self.get_dataset(session, dataset_id)
        user = self.backend_consumer.scope.get('user')
        name = await self.make_unique(og_dataset.name, Dataset, project)

        def _duplicate_dataset(_, og_dataset, user, name):
            return Dataset.duplicate(
                dataset=og_dataset,
                created_by=user.username if user else 'unknown',
                name=name,
            )

        dup_dataset = await session.run_sync(_duplicate_dataset, og_dataset, user, name)

        # Generate visualization
        await self._generate_visualization(session, action, dup_dataset)
        await self.send_data(session, dup_dataset, action.get('id'))

    @RBH.action_handler
    async def receive_czml_point_timeseries(self, event, action, data, session):
        """Handle received get timeseries messages."""
        dataset_id = data.get('id')
        point_id = data.get('point_id')
        variable = data.get('variable')
        dataset = await self.get_dataset(session, dataset_id)

        if dataset.dataset_type not in [Dataset.DatasetTypes.TRIBS_OUT_PIXEL, Dataset.DatasetTypes.TRIBS_OUT_QOUT]:
            raise ValueError(f'Dataset with ID: "{dataset_id}" is not a TRIBS_OUT_PIXEL dataset.')

        def _get_czml_point_file_dataset(session, dataset, point_id, variable):
            # Get pixel file from dataset file collection
            files = os.listdir(dataset.file_collection_client.path)
            if dataset.dataset_type == Dataset.DatasetTypes.TRIBS_OUT_PIXEL:
                extension = '.pixel'
            elif dataset.dataset_type == Dataset.DatasetTypes.TRIBS_OUT_QOUT:
                extension = '.qout'
            point_files = [os.path.join(dataset.file_collection_client.path, f) for f in files if f.endswith(extension)]
            selected_point_file = None
            for f in point_files:
                if os.path.splitext(f)[0].endswith(str(point_id)):
                    selected_point_file = f
                    break

            if not selected_point_file:
                raise ValueError(f'Point file for point ID: "{point_id}" not found in dataset with ID: "{dataset_id}".')

            # Read pixel file
            df = {}
            with open(selected_point_file, 'r') as f:
                _data = f.readlines()
                header, _data = _data[0], _data[1:]
                headers = [x.strip().replace(',', '_').replace('/', '-') for x in re.split(r'\s*\d+-', header)[1:]]
                _data = [tuple(map(float, d.strip().split())) for d in _data]
                point_id = int(_data[0][0])
                df = pd.DataFrame(_data, columns=headers)
            time = df['Time_hr']
            variable_data = df[variable]
            return time, variable_data

        time, variable_data = await session.run_sync(_get_czml_point_file_dataset, dataset, point_id, variable)

        # Create a plotly line plot
        await self.send_action(
            BackendActions.DATASET_GET_PIXEL_TIMESERIES, {
                'x': time.to_list(),
                'y': variable_data.to_list(),
            }
        )

    @RBH.action_handler
    async def receive_mrf_or_rft_timeseries(self, event, action, data, session):
        """Handle received get pixel timeseries messages."""
        dataset_id = data.get('id')
        variable = data.get('variable')
        dataset = await self.get_dataset(session, dataset_id)

        if dataset.dataset_type not in [DatasetTypes.TRIBS_OUT_MRF, DatasetTypes.TRIBS_OUT_RFT]:
            raise ValueError(
                f'Dataset with ID: "{dataset_id}-{dataset.dataset_type}" '
                'is not a TRIBS_OUT_MRF or TRIBS_OUT_RFT dataset.'
            )

        def _get_mrf_or_rft_dataset(session, dataset, variable):
            # Get pixel file from dataset file collection
            files = os.listdir(dataset.file_collection_client.path)

            extension = None
            if dataset.dataset_type == Dataset.DatasetTypes.TRIBS_OUT_MRF:
                extension = '.mrf'
            elif dataset.dataset_type == Dataset.DatasetTypes.TRIBS_OUT_RFT:
                extension = '.rft'

            out_files = [os.path.join(dataset.file_collection_client.path, f) for f in files if f.endswith(extension)]
            selected_out_file = out_files[0] if out_files else None

            if not selected_out_file:
                raise ValueError(f'Output file not found in dataset with ID: "{dataset_id}".')

            # Read pixel file
            df = {}
            with open(selected_out_file, 'r') as f:
                _data = f.readlines()
                header, _data = _data[0], _data[2:]
                headers = [x.strip().replace(',', '_').replace('/', '-') for x in re.split(r'\t', header) if x != '']
                _data = [tuple(map(float, d.strip().split())) for d in _data]
                df = pd.DataFrame(_data, columns=headers)
            time = df['Time']
            variable_data = df[variable]
            return time, variable_data

        time, variable_data = await session.run_sync(_get_mrf_or_rft_dataset, dataset, variable)

        # Create a plotly line plot
        await self.send_action(
            BackendActions.DATASET_GET_MRF_OR_RFT_TIMESERIES, {
                'x': time.to_list(),
                'y': variable_data.to_list(),
            }
        )

    @RBH.action_handler
    async def receive_update(self, event, action, data, session):
        """Handle received update dataset messages."""
        dataset_id = data.get('id')
        dataset = await self.get_dataset(session, dataset_id)
        log.debug(f'Updating dataset with ID: "{dataset.id}" with "{data}"')

        def _update_dataset(session, dataset, data):
            for prop, val in data.items():
                if prop not in self.UPDATABLE_PROPS:
                    continue
                if prop == 'attributes':
                    for attr, aval in val.items():
                        if attr in self.READONLY_ATTRS:
                            continue
                        dataset.set_attribute(attr, aval)
                elif prop == 'status':
                    if val not in dataset.valid_statuses():
                        log.warning(f'Invalid status "{val}" for Dataset with ID: "{dataset_id}", skipping...')
                        continue
                    dataset.set_status(status=val)
                else:
                    # Only set properties that exist on the dataset
                    if getattr(dataset, prop, self.PROP_DNE) != self.PROP_DNE:  # None is valid
                        log.debug(f'Setting property "{prop}" to "{val}"')
                        setattr(dataset, prop, val)
            session.commit()

        await session.run_sync(_update_dataset, dataset, data)

        log.debug(f'Successfully updated dataset with ID: "{dataset_id}"')
        await self.send_data(session, dataset, action.get('id'))

    async def send_processing_progress(self, session, for_action, dataset, status, message, details=None):
        """Send a processing progress message for the given dataset.

        Args:
            session (Session): SQLAlchemy session.
            for_action (dict): Action that processing progress update is for.
            dataset (Dataset): Dataset that is being processed.
            status (str): One of 'processing', 'success', 'error', or 'warning'.
            message (str): A user-friendly message to be displayed to the user.
            details (dict|str): Additional details about the processing progress.
        """
        # Send the progress update
        for_action_id = for_action.get('id')
        await self.send_action(
            BackendActions.DATASET_PROCESSING_PROGRESS, {
                'id': str(dataset.id),
                'progress':
                    {
                        'forActionId': str(for_action_id),
                        'status': status,
                        'message': message,
                        'details': details,
                    },
            }
        )

    async def _generate_visualization(self, session, action, dataset):
        """Generate visualization artifacts for the given dataset.

        Args:
            session (Session): SQLAlchemy session.
            action (dict): Action that triggered the visualization generation.
            dataset (Dataset): Dataset to generate visualization for.

        Raises:
            Exception: will delete the given dataset if an exception occurs and then raise it.
        """
        await self.set_status(session, dataset, dataset.STATUS_PROCESSING)
        await self.send_processing_progress(
            session=session,
            for_action=action,
            dataset=dataset,
            status=dataset.STATUS_PROCESSING,
            message=f'Generating visualization for "{dataset.name}", please wait.',
        )
        try:
            spatial_manager = await self.get_spatial_manager()
            await session.run_sync(dataset.generate_visualization, spatial_manager)
            await self.set_status(session, dataset, dataset.STATUS_COMPLETE)
            await self.send_processing_progress(
                session=session,
                for_action=action,
                dataset=dataset,
                status=dataset.STATUS_COMPLETE,
                message=f'Finished generating visualization for "{dataset.name}".',
            )
        except Exception as e:
            # Remove dataset and file collection if viz creation fails
            await self.set_status(session, dataset, dataset.STATUS_ERROR)
            await self.send_processing_progress(
                session=session,
                for_action=action,
                dataset=dataset,
                status=dataset.STATUS_ERROR,
                message=f'Failed to generate visualization for "{dataset.name}".',
                details=str(e),
            )
            await self._delete_dataset(session, dataset)
            raise e

    async def _remove_visualization(self, session, dataset):
        # Clean up viz
        try:
            spatial_manager = await self.get_spatial_manager()
            await session.run_sync(dataset.remove_visualization, spatial_manager)
        except Exception as e:
            log.exception(f'Failed to remove visualization for dataset with ID: "{dataset.id}". {e}')

    async def _delete_dataset(self, session, dataset, delete_viz=True):
        """Delete the given dataset."""
        # Clean up viz
        if delete_viz:
            await self._remove_visualization(session, dataset)

        # Clean up file collection
        try:

            def _delete_file_collection(_):
                dataset.file_collection_client.delete()

            await session.run_sync(_delete_file_collection)
        except AttributeError as e:
            if "'NoneType' object has no attribute 'id'" in str(e):
                log.warning(f"File collection for dataset with ID: '{dataset.id}' was already deleted. Skipping...")
            else:
                raise e

        await session.delete(dataset)
        await session.commit()
