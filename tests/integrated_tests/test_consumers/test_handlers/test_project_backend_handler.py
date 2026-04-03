import uuid

import pytest

from tethysapp.tribs.consumers.backend_actions import BackendActions


@pytest.mark.asyncio
async def test_project_receive_data(a_session, a_complete_project, make_communicator, tribsutils):
    action_id = str(uuid.uuid4())
    project = a_complete_project
    async with make_communicator(project.id) as communicator:
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.PROJECT_DATA,
                },
                "payload": {
                    "id": str(project.id)
                }
            }
        )
        response = await communicator.receive_json_from()
        assert response["action"]["type"] == BackendActions.PROJECT_DATA
        payload = response["payload"]
        assert payload["id"] == str(project.id)
        assert payload["type"] == project.type
        assert "scenarios" in payload
        scenarios = await tribsutils.a_get_scenarios(a_session, project)
        assert len(payload["scenarios"]) == len(scenarios)
        assert "datasets" in payload
        datasets = await tribsutils.a_get_datasets(a_session, project)
        assert len(payload["datasets"]) == len(datasets)
        assert payload == await tribsutils.a_expected_payload(a_session, project, from_action=action_id)


@pytest.mark.asyncio
async def test_project_receive_update(a_complete_project, make_communicator):
    action_id = str(uuid.uuid4())
    project = a_complete_project
    async with make_communicator(project.id) as communicator:
        assert project.name == 'Test FDB Project'
        assert project.description == 'Initialized Project with File Database.'
        data = {
            "id": str(project.id),
            "name": "updated name",
            "description": "changed description",
            "attributes":
                {
                    "foo": "bar",
                    "project_extent": [1, 2, 3, 4],
                    "file_database_id": "1234",  # read-only, should be ignored
                },
            'status': 'Dirty',
        }
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.PROJECT_UPDATE,
                },
                "payload": data,
            }
        )
        response = await communicator.receive_json_from()
        assert response["action"]["type"] == BackendActions.PROJECT_DATA
        payload = response["payload"]
        assert payload["id"] == data["id"]
        assert payload["name"] == data["name"]
        assert payload["description"] == data["description"]
        assert payload["status"] == data["status"]
        assert payload["attributes"]["foo"] == data["attributes"]["foo"]
        assert payload["attributes"]["project_extent"] == data["attributes"]["project_extent"]


@pytest.mark.asyncio
async def test_project_receive_update_invalid_vals(a_complete_project, make_communicator):
    action_id = str(uuid.uuid4())
    project = a_complete_project
    async with make_communicator(project.id) as communicator:
        assert project.name == 'Test FDB Project'
        assert project.description == 'Initialized Project with File Database.'
        data = {
            "id": str(project.id),
            "name": "updated name 2",
            "description": "changed description 2",
            'status': 'Foo',  # Invalid status
            'dne': 43,  # Non-extistant property
        }
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.PROJECT_UPDATE,
                },
                "payload": data,
            }
        )
        response = await communicator.receive_json_from()
        assert response["action"]["type"] == BackendActions.PROJECT_DATA
        payload = response["payload"]
        assert payload["id"] == data["id"]
        assert payload["name"] == data["name"]
        assert payload["description"] == data["description"]
        assert payload["status"] != data["status"]  # invalid status should be ignored
        assert "dne" not in payload
