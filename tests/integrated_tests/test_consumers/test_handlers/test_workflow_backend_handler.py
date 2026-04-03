import uuid

import pytest

from tribs_adapter.workflows import TRIBS_WORKFLOWS
from tethysapp.tribs.consumers.backend_actions import BackendActions


def _get_workflow_status(session, workflow):
    return workflow.get_status()


def _get_steps(session, workflow):
    return workflow.steps


def _get_results(session, workflow):
    return workflow.results


@pytest.mark.asyncio
async def test_workflow_receive_data(a_session, a_complete_project, make_communicator, tribsutils, mocker):
    mocker.patch(
        'tethysext.atcore.models.app_users.resource_workflow.reverse',
        return_value='/foo/bar/',
    )
    action_id = str(uuid.uuid4())
    project = a_complete_project
    workflows = await tribsutils.a_get_workflows(a_session, project)
    assert len(workflows) > 0
    workflow = workflows[0]
    async with make_communicator(project.id) as communicator:
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.WORKFLOW_DATA,
                },
                "payload": {
                    "id": str(workflow.id)
                }
            }
        )
        response = await communicator.receive_json_from()
        assert response["action"]["type"] == BackendActions.WORKFLOW_DATA
        payload = response["payload"]
        assert payload["id"] == str(workflow.id)
        assert payload["type"] == workflow.type
        assert payload == await tribsutils.a_expected_payload(a_session, workflow, from_action=action_id)


@pytest.mark.asyncio
async def test_workflow_receive_data_all(a_session, a_complete_project, make_communicator, tribsutils, mocker):
    mocker.patch(
        'tethysext.atcore.models.app_users.resource_workflow.reverse',
        return_value='/foo/bar/',
    )
    action_id = str(uuid.uuid4())
    project = a_complete_project
    workflows = await tribsutils.a_get_workflows(a_session, project)
    workflows = {str(w.id): w for w in workflows}
    async with make_communicator(project.id) as communicator:
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.WORKFLOW_DATA_ALL,
                },
                "payload": {
                    "initial": True,
                }
            }
        )
        response = await communicator.receive_json_from()
        assert response["action"]["type"] == BackendActions.WORKFLOW_DATA_ALL
        payload = response["payload"]
        assert "available" in payload
        assert "history" in payload
        availalbe = payload["available"]
        assert len(availalbe) == 1
        assert "workflows" in availalbe[0]
        assert len(availalbe[0]["workflows"]) == len(TRIBS_WORKFLOWS)
        assert "name" in availalbe[0]
        assert availalbe[0]["name"] == "tRIBS"
        history = payload["history"]
        assert len(history) == len(workflows)
        for h in history:
            assert h == await tribsutils.a_expected_payload(a_session, workflows[h["id"]])


@pytest.mark.asyncio
async def test_workflow_receive_delete(a_session, a_complete_project, make_communicator, tribsutils):
    action_id = str(uuid.uuid4())
    project = a_complete_project
    workflows = await tribsutils.a_get_workflows(a_session, project)
    num_workflows = len(workflows)
    assert num_workflows >= 1
    workflow = workflows[0]
    workflow_id = str(workflow.id)
    async with make_communicator(project.id) as communicator:
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.WORKFLOW_DELETE,
                },
                "payload": {
                    "id": workflow_id
                }
            }
        )
        response = await communicator.receive_json_from()
        assert response["action"]["type"] == BackendActions.WORKFLOW_DELETE
        payload = response["payload"]
        assert payload == {"id": workflow_id}
        await a_session.refresh(project)
        post_workflows = await tribsutils.a_get_workflows(a_session, project)
        assert len(post_workflows) == num_workflows - 1


@pytest.mark.asyncio
async def test_workflow_receive_create(a_session, a_empty_project, make_communicator, tribsutils, mocker):
    mock_reverse = mocker.patch(
        'tethysext.atcore.models.app_users.resource_workflow.reverse',
        return_value='/foo/bar/',
    )
    action_id = str(uuid.uuid4())
    project = a_empty_project
    workflows = await tribsutils.a_get_workflows(a_session, project)
    assert len(workflows) == 0
    async with make_communicator(project.id, user=True) as communicator:
        data = {
            "type": "bulk_data_retrieval_workflow",
        }
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.WORKFLOW_CREATE,
                },
                "payload": data,
            }
        )
        response = await communicator.receive_json_from()
        assert response["action"]["type"] == BackendActions.WORKFLOW_DATA
        payload = response["payload"]
        await a_session.refresh(project)
        post_workflows = await tribsutils.a_get_workflows(a_session, project)
        assert len(post_workflows) == 1
        assert payload == await tribsutils.a_expected_payload(a_session, post_workflows[0], from_action=action_id)
        assert mock_reverse.called_with(
            'tribs:_workflow',
            kwargs={
                'resource_id': post_workflows[0].resource_id,
                'workflow_id': post_workflows[0].id
            }
        )
        assert payload['url'] == '/foo/bar/'


@pytest.mark.asyncio
async def test_workflow_receive_update(a_session, a_complete_project, make_communicator, tribsutils, mocker):
    mocker.patch(
        'tethysext.atcore.models.app_users.resource_workflow.reverse',
        return_value='/foo/bar/',
    )
    action_id = str(uuid.uuid4())
    project = a_complete_project
    workflows = await tribsutils.a_get_workflows(a_session, project)
    assert len(workflows) >= 1
    workflow = workflows[0]
    assert workflow.name != 'updated name'
    workflow_status = await a_session.run_sync(_get_workflow_status, workflow)
    assert workflow_status == 'Pending'
    async with make_communicator(project.id) as communicator:
        data = {
            "id": str(workflow.id),
            "name": "updated name",
            "attributes": {
                "foo": "bar",
            },
            'status': 'Dirty',  # Should be unchanged
        }
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.WORKFLOW_UPDATE,
                },
                "payload": data,
            }
        )
        response = await communicator.receive_json_from()
        assert response["action"]["type"] == BackendActions.WORKFLOW_DATA
        payload = response["payload"]
        assert payload["id"] == data["id"]
        assert payload["name"] == data["name"]
        assert payload["status"] != data["status"]
        assert payload["status"] == "Pending"
        assert payload["attributes"]["foo"] == data["attributes"]["foo"]


@pytest.mark.asyncio
async def test_workflow_receive_duplicate(
    a_session, a_complete_project, make_communicator, test_files, tribsutils, mocker
):
    mocker.patch(
        'tethysext.atcore.models.app_users.resource_workflow.reverse',
        return_value='/foo/bar/',
    )
    action_id = str(uuid.uuid4())
    project = a_complete_project
    workflows = await tribsutils.a_get_workflows(a_session, project)
    num_workflows = len(workflows)
    assert num_workflows >= 1
    workflow = workflows[0]
    workflow_id = str(workflow.id)
    async with make_communicator(project.id) as communicator:
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.WORKFLOW_DUPLICATE,
                },
                "payload": {
                    "id": workflow_id,
                }
            }
        )
        response = await communicator.receive_json_from()
        assert response["action"]["type"] == BackendActions.WORKFLOW_DATA
        payload = response["payload"]
        assert tribsutils.is_uuid4(payload["id"])
        assert payload["id"] != str(workflow.id)
        assert payload["date_created"] != workflow.date_created.isoformat()
        assert payload["type"] == workflow.type
        assert payload["name"] == f"{workflow.name} (1)"
        steps = await a_session.run_sync(_get_steps, workflow)
        assert len(payload["steps"]) == len(steps)  # Same as original workflow
        results = await a_session.run_sync(_get_results, workflow)
        assert len(payload["results"]) == len(results)  # Same as original workflow

    await a_session.refresh(project)
    post_workflows = await tribsutils.a_get_workflows(a_session, project)
    assert len(post_workflows) == num_workflows + 1
