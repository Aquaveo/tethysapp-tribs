import logging
from collections import namedtuple

from aiopath import AsyncPath
from asgiref.sync import sync_to_async
from channels.db import database_sync_to_async
from pydantic import ValidationError
from tethysext.atcore.models.app_users import Resource, ResourceWorkflow, AppUser

from tribs_adapter.resources import Project, Scenario, Dataset, Realization
from tribs_adapter.services.tribs_spatial_manager import TribsSpatialManager
from ..backend_actions import BackendActions
from ..exc import LinkedDatasetError
from tethysapp.tribs.app import Tribs as app

log = logging.getLogger(__name__)


class ResourceBackendHandler:
    SEND_DATA_ACTION: BackendActions = None
    PROP_DNE = '###prop-doesnt-exist###'  # For getattr checks where None value is valid

    def __init__(self, backend_consumer):
        self.backend_consumer = backend_consumer
        self.sessionmaker = backend_consumer.sessionmaker

    @property
    def receiving_actions(self) -> dict[BackendActions, callable]:
        raise NotImplementedError("The receiving_actions property must be implemented by the subclass.")

    def action_handler(method):
        """Decorator method to automatically handle sqlalchemy async session and errors."""
        async def _action_handler(self, event, action, data):
            async with self.sessionmaker() as session:
                try:
                    await method(self, event, action, data, session)
                except LinkedDatasetError as e:
                    msg = str(e)

                    def _get_linked_scenario_ids(session, dataset):
                        return [str(s.id) for s in dataset.linked_scenarios]

                    def _get_linked_realization_ids(session, dataset):
                        return [str(r.id) for r in dataset.linked_realizations]

                    await self.send_error(
                        msg, action, data, {
                            'dataset_id': str(e.dataset.id),
                            'linked_scenarios': await session.run_sync(_get_linked_scenario_ids, e.dataset),
                            'linked_realizations': await session.run_sync(_get_linked_realization_ids, e.dataset),
                        }
                    )
                    log.debug(msg)
                except ValidationError as e:
                    msg = f'Validation error occurred while handling {action.get("type")} action "{action.get("id")}".'
                    await self.send_error(msg, action, data, {'errors': e.errors()})
                    log.debug(msg)
                except ValueError as e:
                    msg = str(e)
                    await self.send_error(msg, action, data)
                    log.debug(msg)
                except Exception:
                    msg = f'An unexpected error occurred while handling action: {action}'
                    await self.send_error(msg, action, data)
                    log.exception(msg)

        return _action_handler

    def _get_request(self):
        FakeRequest = namedtuple('FakeRequest', ['user'])
        r = FakeRequest(user=self.backend_consumer.scope.get('user'), )
        return r

    async def make_unique(self, given_name: str, R: Resource | ResourceWorkflow, project: Project) -> str:
        """Make a name unique for a resource in a project.

        Args:
            given_name: The name to start with.
            resource: The Resource or ResourceWorkflow model to query.
            project: The Project instance to filter by.

        Returns:
            str: A unique name.
        """
        def count_duplicates(session, name):
            # Check for existing name
            if R is ResourceWorkflow:
                num_duplicate_names = session.query(R) \
                    .filter(R.resource == project) \
                    .filter(R.name == name) \
                    .count()
            else:
                # Note: Resource.project is not a property that can be used in querying
                num_duplicate_names = session.query(R) \
                    .filter(Resource.parents.contains(project)) \
                    .filter(R.name == name) \
                    .count()
            return num_duplicate_names

        async with self.sessionmaker() as session:
            async with session.begin():
                # If no duplicates, return the given name
                num_duplicate_names = await session.run_sync(count_duplicates, name=given_name)
                if num_duplicate_names == 0:
                    return given_name

                # Find a unique name
                name_count = 0
                new_name = f'{given_name} (copy)'  # Fallback name
                while True:
                    name_count += 1
                    new_name = f'{given_name} ({name_count})'
                    num_duplicate_names = await session.run_sync(count_duplicates, name=new_name)
                    if num_duplicate_names == 0:
                        break
                return new_name

    async def get_app_user(self, session) -> AppUser:
        """Get the AppUser for the scope user."""
        user = self.backend_consumer.scope.get('user')
        if not user:
            return None

        request = self._get_request()

        def _get_app_user_from_request(session, request, create):
            return AppUser.get_app_user_from_request(request, session, create)

        return await session.run_sync(_get_app_user_from_request, request=request, create=False)

    def get_project_id(self) -> str:
        """Get Project ID from URL."""
        return self.backend_consumer.project_id

    async def get_project(self, session) -> Project:
        """Get Project from DB by ID in the URL."""
        project_id = self.get_project_id()

        def _query(session, project_id):
            return session.query(Project).get(project_id)

        project = await session.run_sync(_query, project_id=project_id)
        if not project:
            raise ValueError(f'Could not find Project with ID "{project_id}"')
        return project

    async def get_scenario(self, session, scenario_id) -> Scenario:
        """Get Scenario from DB by ID."""
        def _query(session, scenario_id):
            return session.query(Scenario).get(scenario_id)

        scenario = await session.run_sync(_query, scenario_id=scenario_id)
        if not scenario:
            raise ValueError(f'Could not find Scenario with ID "{scenario_id}"')
        return scenario

    async def get_realization(self, session, realization_id) -> Realization:
        """Get Realization from DB by ID."""
        def _query(session, realization_id):
            return session.query(Realization).get(realization_id)

        realization = await session.run_sync(_query, realization_id=realization_id)
        if not realization:
            raise ValueError(f'Could not find Realization with ID "{realization_id}"')
        return realization

    async def get_dataset(self, session, dataset_id) -> Dataset:
        """Get Dataset from DB by ID."""
        def _query(session, dataset_id):
            return session.query(Dataset).get(dataset_id)

        dataset = await session.run_sync(_query, dataset_id=dataset_id)
        if not dataset:
            raise ValueError(f'Could not find Dataset with ID "{dataset_id}"')
        return dataset

    async def get_workflow(self, session, workflow_id) -> ResourceWorkflow:
        """Get Workflow from DB by ID."""
        def _query(session, workflow_id):
            return session.query(ResourceWorkflow).get(workflow_id)

        workflow = await session.run_sync(_query, workflow_id=workflow_id)
        if not workflow:
            raise ValueError(f'Could not find Workflow with ID "{workflow_id}"')
        return workflow

    async def get_uploads_dir(self) -> AsyncPath:
        """Get the uploads directory for the current project."""
        project_id = self.get_project_id()
        app_workspace = await sync_to_async(app.get_app_workspace)()
        project_uploads_dir = AsyncPath(app_workspace.path) / 'uploads' / project_id
        log.debug(f'Using project uploads directory: "{project_uploads_dir}"')
        await project_uploads_dir.mkdir(parents=True, exist_ok=True)
        return project_uploads_dir

    async def get_spatial_manager(self):
        gs_engine = await database_sync_to_async(app.get_spatial_dataset_service)(app.GEOSERVER_NAME, as_engine=True)
        spatial_manager = TribsSpatialManager(gs_engine)
        return spatial_manager

    async def send_data(self, session, resource: Resource | ResourceWorkflow, from_action: str):
        """Serialize and send given scenario."""
        if not self.SEND_DATA_ACTION:
            log.error(f'No SEND_DATA_ACTION defined for "{self.__class__.__name__}".')
            raise NotImplementedError("The send_data_action property must be implemented by the subclass.")

        def _serialize(_, resource):
            # Add metadata for frontend
            if from_action:
                resource.set_attribute('fromAction', str(from_action))

            # Resource.serialize ends calls lazy loaded properties (e.g. Resource.organizations)
            return resource.serialize()

        data_json = await session.run_sync(_serialize, resource=resource)

        await self.send_action(self.SEND_DATA_ACTION, data_json)

    async def send_action(self, action: BackendActions, payload: dict):
        await self.backend_consumer.send_action(action, payload)

    async def send_acknowledge(self, msg: str, action: BackendActions, payload: dict, details: dict = None):
        """Convenience wrapper for consumer send_acknowledge()."""
        await self.backend_consumer.send_acknowledge(msg, action, payload, details)

    async def send_error(self, msg: str, action: dict, payload: dict, details: dict = None):
        """Convenience wrapper for consumer send_error()."""
        await self.backend_consumer.send_error(msg, action, payload, details)

    async def set_status(self, session, resource, status):
        """Set the status of a Resource and commit the session.
        Args:
            session (Session): SQLAlchemy session.
            resource (Resource): Resource to set the status for.
            status (str): Status to set on the resource.
        """
        def _set_status(s, resource, status):
            resource.set_status(status=status)
            s.commit()

        await session.run_sync(_set_status, resource=resource, status=status)
