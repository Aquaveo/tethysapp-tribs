import logging

from ..backend_actions import BackendActions
from .resource_backend_handler import ResourceBackendHandler as RBH

log = logging.getLogger(__name__)


class RealizationBackendHandler(RBH):
    SEND_DATA_ACTION: BackendActions = BackendActions.REALIZATION_DATA
    UPDATABLE_PROPS = ['name', 'description', 'attributes', 'public', 'status']
    READONLY_ATTRS = ['files', 'input_file']  # Input File is read-only for realizations

    @property
    def receiving_actions(self) -> dict[BackendActions, callable]:
        return {
            BackendActions.REALIZATION_DATA: self.receive_data,
            BackendActions.REALIZATION_DELETE: self.receive_delete,
            BackendActions.REALIZATION_UPDATE: self.receive_update,
        }

    @RBH.action_handler
    async def receive_data(self, event, action, data, session):
        """Handle received get realization messages."""
        realization_id = data.get('id')
        realization = await self.get_realization(session, realization_id)
        await self.send_data(session, realization, action.get('id'))

    @RBH.action_handler
    async def receive_delete(self, event, action, data, session):
        """Handle received delete realization messages."""
        realization_id = data.get('id')
        log.debug(f'Deleting realization with ID: "{realization_id}"')
        realization = await self.get_realization(session, realization_id)

        def _delete_realization(session, realization):
            session.delete(realization)
            session.commit()

        await session.run_sync(_delete_realization, realization)
        log.debug(f'Deleted realization with ID: "{realization_id}"')
        await self.send_action(BackendActions.REALIZATION_DELETE, {"id": str(realization_id)})

    @RBH.action_handler
    async def receive_update(self, event, action, data, session):
        """Handle received update realization messages."""
        realization_id = data.get('id')
        realization = await self.get_realization(session, realization_id)
        log.debug(f'Updating realization with ID: "{realization.id}" with "{data}"')

        def _update_realization(session, realization, data):
            for prop, val in data.items():
                if prop not in self.UPDATABLE_PROPS:
                    continue

                if prop == 'attributes':
                    for attr, aval in val.items():
                        if attr in self.READONLY_ATTRS:
                            continue
                        realization.set_attribute(attr, aval)
                elif prop == 'status':
                    if val not in realization.valid_statuses():
                        log.warning(f'Invalid status "{val}" for Realization with ID: "{realization_id}", skipping...')
                        continue
                    realization.set_status(status=val)
                else:
                    # Only set properties that exist on the realization
                    if getattr(realization, prop, self.PROP_DNE) != self.PROP_DNE:
                        log.debug(f'Setting property "{prop}" to "{val}"')
                        setattr(realization, prop, val)
            session.commit()

        await session.run_sync(_update_realization, realization, data)
        log.debug(f'Successfully updated realization with ID: "{realization_id}"')
        await self.send_data(session, realization, action.get('id'))
