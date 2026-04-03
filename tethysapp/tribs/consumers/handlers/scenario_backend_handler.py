import logging

from sqlalchemy.orm.session import make_transient

from tribs_adapter.resources import Scenario, Dataset
from ..backend_actions import BackendActions
from .resource_backend_handler import ResourceBackendHandler as RBH

log = logging.getLogger(__name__)


class ScenarioBackendHandler(RBH):
    SEND_DATA_ACTION: BackendActions = BackendActions.SCENARIO_DATA
    UPDATABLE_PROPS = ['name', 'description', 'attributes', 'public', 'status']
    READONLY_ATTRS = ['files', 'input_file']  # Input File handled with different action

    @property
    def receiving_actions(self) -> dict[BackendActions, callable]:
        return {
            BackendActions.SCENARIO_CREATE: self.receive_create,
            BackendActions.SCENARIO_DATA: self.receive_data,
            BackendActions.SCENARIO_DELETE: self.receive_delete,
            BackendActions.SCENARIO_LINK_DATASET: self.receive_link_dataset,
            BackendActions.SCENARIO_UNLINK_DATASET: self.receive_unlink_dataset,
            BackendActions.SCENARIO_UPDATE: self.receive_update,
            BackendActions.SCENARIO_UPDATE_INPUTFILE: self.receive_update_inputfile,
            BackendActions.SCENARIO_DUPLICATE: self.receive_duplicate,
        }

    @RBH.action_handler
    async def receive_create(self, event, action, data, session):
        """Handle received create scenario messages."""
        project = await self.get_project(session)
        user = self.backend_consumer.scope.get('user')
        created_by = user.username if user else 'unknown'

        def _create_scenario(session, data, created_by, project):
            return Scenario.new(
                session=session,
                name=data.get('name'),
                description=data.get('description'),
                created_by=created_by,
                project=project,
            )

        new_scenario = await session.run_sync(_create_scenario, data, created_by, project)
        await self.send_data(session, new_scenario, action.get('id'))

    @RBH.action_handler
    async def receive_data(self, event, action, data, session):
        """Handle received get scenario messages."""
        scenario_id = data.get('id')
        scenario = await self.get_scenario(session, scenario_id)
        await self.send_data(session, scenario, action.get('id'))

    @RBH.action_handler
    async def receive_delete(self, event, action, data, session):
        """Handle received delete scenario messages."""
        scenario_id = data.get('id')
        log.debug(f'Deleting scenario with ID: "{scenario_id}"')
        scenario = await self.get_scenario(session, scenario_id)

        def _delete_scenario(session, scenario):
            session.delete(scenario)
            session.commit()

        await session.run_sync(_delete_scenario, scenario)
        log.debug(f'Deleted scenario with ID: "{scenario_id}"')
        await self.send_action(BackendActions.SCENARIO_DELETE, {"id": str(scenario_id)})

    @RBH.action_handler
    async def receive_duplicate(self, event, action, data, session):
        """Handle received duplicate scenario messages."""
        scenario_id = data.get('id')
        log.debug(f'Duplicating scenario with ID: "{scenario_id}"')
        project = await self.get_project(session)
        scenario = await self.get_scenario(session, scenario_id)
        dup_name = await self.make_unique(scenario.name, Scenario, project)
        user = self.backend_consumer.scope.get('user')

        def _duplicate_scenario(session, project, scenario, dup_name, user):
            lids = [ld.id for ld in scenario.linked_datasets]
            session.expunge(scenario)
            make_transient(scenario)
            scenario.id = None
            scenario.name = dup_name
            scenario.date_created = None  # will be set in DB
            scenario.created_by = user.username if user else 'unknown'
            for lid in lids:
                dataset = session.query(Dataset).get(lid)
                scenario.add_link(dataset)
            scenario.project = project
            session.add(scenario)
            session.commit()
            return scenario

        dup_scenario = await session.run_sync(_duplicate_scenario, project, scenario, dup_name, user)
        await self.send_data(session, dup_scenario, action.get('id'))

    @RBH.action_handler
    async def receive_link_dataset(self, event, action, data, session):
        """Handle received link dataset messages."""
        dataset_id = data.get('dataset_id')
        scenario_id = data.get('scenario_id')
        card = data.get('card')
        log.debug(f'Linking dataset with ID "{dataset_id}" to scenario with ID "{scenario_id}"')
        scenario = await self.get_scenario(session, scenario_id)
        dataset = await self.get_dataset(session, dataset_id)

        def _link_dataset(session, scenario, dataset, card):
            scenario.link_dataset(dataset, card)
            session.commit()

        await session.run_sync(_link_dataset, scenario, dataset, card)
        await self.send_data(session, scenario, action.get('id'))

    @RBH.action_handler
    async def receive_unlink_dataset(self, event, action, data, session):
        """Handle received unlink dataset messages."""
        dataset_id = data.get('dataset_id')
        scenario_id = data.get('scenario_id')
        card = data.get('card')
        log.debug(f'Linking dataset with ID "{dataset_id}" to scenario with ID "{scenario_id}"')
        scenario = await self.get_scenario(session, scenario_id)
        dataset = await self.get_dataset(session, dataset_id)

        def _unlink_dataset(session, dataset, card):
            scenario.unlink_dataset(dataset, card)
            session.commit()

        await session.run_sync(_unlink_dataset, dataset, card)
        await self.send_data(session, scenario, action.get('id'))

    @RBH.action_handler
    async def receive_update(self, event, action, data, session):
        """Handle received update scenario messages."""
        scenario_id = data.get('id')
        scenario = await self.get_scenario(session, scenario_id)
        log.debug(f'Updating scenario with ID: "{scenario.id}" with "{data}"')

        def _update_scenario(session, scenario, data):
            for prop, val in data.items():
                if prop not in self.UPDATABLE_PROPS:
                    continue

                if prop == 'attributes':
                    for attr, aval in val.items():
                        if attr in self.READONLY_ATTRS:
                            continue
                        scenario.set_attribute(attr, aval)
                elif prop == 'status':
                    if val not in scenario.valid_statuses():
                        log.warning(f'Invalid status "{val}" for Scenario with ID: "{scenario_id}", skipping...')
                        continue
                    scenario.set_status(status=val)
                else:
                    # Only set properties that exist on the scenario
                    if getattr(scenario, prop, self.PROP_DNE) != self.PROP_DNE:
                        log.debug(f'Setting property "{prop}" to "{val}"')
                        setattr(scenario, prop, val)
            session.commit()

        await session.run_sync(_update_scenario, scenario, data)
        log.debug(f'Successfully updated scenario with ID: "{scenario_id}"')
        await self.send_data(session, scenario, action.get('id'))

    @RBH.action_handler
    async def receive_update_inputfile(self, event, action, data, session):
        """Handle received update input file messages."""
        scenario_id = data.get('id')
        input_file = data.get('input_file')
        scenario = await self.get_scenario(session, scenario_id)
        log.debug(f'Updating scenario with ID: "{scenario.id}"...')

        def _update_input_file(session, scenario, input_file):
            scenario.update_input_file(input_file)

        await session.run_sync(_update_input_file, scenario, input_file)
        log.debug(f'Successfully updated scenario with ID: "{scenario_id}"')
        await self.send_data(session, scenario, action.get('id'))
