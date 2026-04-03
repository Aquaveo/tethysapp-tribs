import datetime as dt
import logging

from sqlalchemy.orm.session import make_transient
from tethysext.atcore.models.app_users import ResourceWorkflow, ResourceWorkflowStep, ResourceWorkflowResult

from tribs_adapter.workflows import TRIBS_WORKFLOWS
from tribs_adapter.services.tribs_spatial_manager import TribsSpatialManager
from ..backend_actions import BackendActions
from .resource_backend_handler import ResourceBackendHandler as RBH

from tethysapp.tribs.services.tribs_map_manager import TribsMapManager
from tethysapp.tribs.app import Tribs as app

log = logging.getLogger(__name__)


class WorkflowBackendHandler(RBH):
    SEND_DATA_ACTION: BackendActions = BackendActions.WORKFLOW_DATA
    UPDATABLE_PROPS = ['name', 'attributes']
    READONLY_ATTRS = ['files']

    @property
    def receiving_actions(self) -> dict[BackendActions, callable]:
        return {
            BackendActions.WORKFLOW_CREATE: self.receive_create,
            BackendActions.WORKFLOW_DATA: self.receive_data,
            BackendActions.WORKFLOW_DATA_ALL: self.receive_data_all,
            BackendActions.WORKFLOW_DELETE: self.receive_delete,
            BackendActions.WORKFLOW_UPDATE: self.receive_update,
            BackendActions.WORKFLOW_DUPLICATE: self.receive_duplicate,
        }

    async def send_data_all(self, workflows: list[ResourceWorkflow], session):
        """Send Workflows to frontend."""
        def _serialize_workflow(session, workflow, format):
            return workflow.serialize(format=format)

        d = {
            "available":
                [
                    {
                        "name":
                            "tRIBS",
                        "workflows":
                            [
                                {
                                    "type": t,
                                    "name": tw.DISPLAY_TYPE_SINGULAR,
                                    "description": "",
                                } for t, tw in TRIBS_WORKFLOWS.items()
                            ]
                    }
                ],
            "history": [await session.run_sync(_serialize_workflow, w, 'dict') for w in workflows]
        }

        await self.send_action(BackendActions.WORKFLOW_DATA_ALL, d)

    @RBH.action_handler
    async def receive_create(self, event, action, data, session):
        """Handle received create workflow messages."""
        workflow_type = data.get('type')
        if workflow_type not in TRIBS_WORKFLOWS:
            raise ValueError(f'Invalid workflow type: "{workflow_type}"')
        project = await self.get_project(session)
        creator = await self.get_app_user(session)

        def _create_workflow(session, project, workflow_type, creator):
            WorkflowClass = TRIBS_WORKFLOWS[workflow_type]
            time_stamp = dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
            workflow = WorkflowClass.new(
                app=app,
                name=f"{WorkflowClass.DISPLAY_TYPE_SINGULAR} {time_stamp}",
                resource_id=str(project.id),
                creator_id=str(creator.id) if creator else None,
                geoserver_name=app.GEOSERVER_NAME,
                map_manager=TribsMapManager,
                spatial_manager=TribsSpatialManager,
            )
            project.workflows.append(workflow)
            session.commit()
            return workflow

        new_workflow = await session.run_sync(_create_workflow, project, workflow_type, creator)
        await self.send_data(session, new_workflow, action.get('id'))

    @RBH.action_handler
    async def receive_data(self, event, action, data, session):
        """Handle received workflow data messages."""
        workflow_id = data.get('id')
        workflow = await self.get_workflow(session, workflow_id)
        await self.send_data(session, workflow, action.get('id'))

    @RBH.action_handler
    async def receive_data_all(self, event, action, data, session):
        """Handle received workflow data all messages."""
        # Get all workflows for Project
        project = await self.get_project(session)

        def _get_workflows(session, project):
            return session.query(ResourceWorkflow).\
                filter(ResourceWorkflow.resource == project).\
                order_by(ResourceWorkflow.date_created.desc()).\
                all()

        workflows = await session.run_sync(_get_workflows, project)
        await self.send_data_all(workflows, session)

    @RBH.action_handler
    async def receive_delete(self, event, action, data, session):
        """Handle received delete workflow messages."""
        workflow_id = data.get('id')
        log.debug(f'Deleting workflow with ID: "{workflow_id}"')
        workflow = await self.get_workflow(session, workflow_id)

        def _delete_workflow(session, workflow):
            session.delete(workflow)
            session.commit()

        await session.run_sync(_delete_workflow, workflow)
        log.debug(f'Deleted workflow with ID: "{workflow_id}"')
        await self.send_action(BackendActions.WORKFLOW_DELETE, {"id": str(workflow_id)})

    @RBH.action_handler
    async def receive_duplicate(self, event, action, data, session):
        """Handle received duplicate workflow messages."""
        workflow_id = data.get('id')
        log.debug(f'Duplicating workflow with ID: "{workflow_id}"')
        project = await self.get_project(session)
        workflow = await self.get_workflow(session, workflow_id)
        dup_name = await self.make_unique(workflow.name, ResourceWorkflow, project)
        creator = await self.get_app_user(session)

        def _duplicate_workflow(session, project, workflow, creator, dup_name):
            sids = [s.id for s in workflow.steps]
            rids = [r.id for r in workflow.results]
            session.expunge(workflow)
            make_transient(workflow)
            workflow.id = None
            workflow.name = dup_name
            workflow.date_created = None  # will be set in DB
            workflow.creator = creator
            workflow.steps = []
            workflow.results = []

            # Copy steps
            for sid in sids:
                step = session.query(ResourceWorkflowStep).get(sid)
                session.expunge(step)
                make_transient(step)
                step.id = None
                workflow.steps.append(step)

            # Copy results
            for rid in rids:
                result = session.query(ResourceWorkflowResult).get(rid)
                session.expunge(result)
                make_transient(result)
                result.id = None
                workflow.results.append(result)

            workflow.resource = project
            session.add(workflow)
            session.commit()
            return workflow

        dup_workflow = await session.run_sync(_duplicate_workflow, project, workflow, creator, dup_name)
        await self.send_data(session, dup_workflow, action.get('id'))

    @RBH.action_handler
    async def receive_update(self, event, action, data, session):
        """Handle received update workflow messages."""
        workflow_id = data.get('id')
        workflow = await self.get_workflow(session, workflow_id)
        log.debug(f'Updating workflow with ID: "{workflow.id}" with "{data}"')

        def _update_workflow(session, workflow, data):
            for prop, val in data.items():
                if prop not in self.UPDATABLE_PROPS:
                    continue

                if prop == 'attributes':
                    for attr, aval in val.items():
                        if attr in self.READONLY_ATTRS:
                            continue
                        workflow.set_attribute(attr, aval)
                else:
                    # Only set properties that exist on the workflow
                    if getattr(workflow, prop, self.PROP_DNE) != self.PROP_DNE:
                        log.debug(f'Setting property "{prop}" to "{val}"')
                        setattr(workflow, prop, val)

            session.commit()

        await session.run_sync(_update_workflow, workflow, data)
        log.debug(f'Successfully updated workflow with ID: "{workflow_id}"')
        await self.send_data(session, workflow, action.get('id'))
