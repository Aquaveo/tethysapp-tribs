import logging

from ..backend_actions import BackendActions
from .resource_backend_handler import ResourceBackendHandler as RBH

log = logging.getLogger(__name__)


class ProjectBackendHandler(RBH):
    SEND_DATA_ACTION: BackendActions = BackendActions.PROJECT_DATA
    UPDATABLE_PROPS = ['name', 'description', 'attributes', 'public', 'status']
    READONLY_ATTRS = ['files', 'file_database_id']

    @property
    def receiving_actions(self) -> dict[BackendActions, callable]:
        return {
            BackendActions.PROJECT_DATA: self.receive_data,
            BackendActions.PROJECT_UPDATE: self.receive_update,
        }

    @RBH.action_handler
    async def receive_data(self, event, action, data, session):
        project = await self.get_project(session)
        log.debug(f'Sending project data for project with ID "{project.id}"')
        await self.send_data(session, project, action.get('id'))

    @RBH.action_handler
    async def receive_update(self, event, action, data, session):
        """Handle received update project messages."""
        project = await self.get_project(session)

        def _update_project(session, project, data):
            log.debug(f'Updating project with ID: "{project.id}" with "{data}"')
            for prop, val in data.items():
                if prop not in self.UPDATABLE_PROPS:
                    continue

                if prop == 'attributes':
                    for attr, aval in val.items():
                        if attr in self.READONLY_ATTRS:
                            continue
                        project.set_attribute(attr, aval)
                elif prop == 'status':
                    if val not in project.valid_statuses():
                        log.warning(f'Invalid status "{val}" for Project with ID: "{project.id}", skipping...')
                        continue
                    project.set_status(status=val)
                else:
                    # Only set properties that exist on the project
                    if getattr(project, prop, self.PROP_DNE) != self.PROP_DNE:
                        log.debug(f'Setting property "{prop}" to "{val}"')
                        setattr(project, prop, val)
            session.commit()

        await session.run_sync(_update_project, project, data)
        log.debug(f'Successfully updated project with ID: "{project.id}"')
        await self.send_data(session, project, action.get('id'))
