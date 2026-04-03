import uuid

import pytest

from tethysapp.tribs.consumers.backend_actions import BackendActions


@pytest.mark.asyncio
async def test_realization_receive_data(a_session, a_complete_project, make_communicator, tribsutils):
    action_id = str(uuid.uuid4())
    project = a_complete_project
    realization = (await tribsutils.a_get_realizations(a_session, project))[0]
    async with make_communicator(project.id) as communicator:
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.REALIZATION_DATA,
                },
                "payload": {
                    "id": str(realization.id)
                }
            }
        )
        response = await communicator.receive_json_from()
        assert response["action"]["type"] == BackendActions.REALIZATION_DATA
        payload = response["payload"]
        assert payload["id"] == str(realization.id)
        assert payload["type"] == realization.type
        assert payload == await tribsutils.a_expected_payload(a_session, realization, from_action=action_id)


@pytest.mark.asyncio
async def test_realization_receive_delete(a_session, a_complete_project, make_communicator, tribsutils):
    action_id = str(uuid.uuid4())
    project = a_complete_project
    realization = (await tribsutils.a_get_realizations(a_session, project))[0]
    async with make_communicator(project.id) as communicator:
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.REALIZATION_DELETE,
                },
                "payload": {
                    "id": str(realization.id)
                }
            }
        )
        response = await communicator.receive_json_from()
        assert response["action"]["type"] == BackendActions.REALIZATION_DELETE
        payload = response["payload"]
        assert payload == {"id": str(realization.id)}


@pytest.mark.asyncio
async def test_realization_receive_update(a_session, a_complete_project, make_communicator, tribsutils):
    action_id = str(uuid.uuid4())
    project = a_complete_project
    realization = (await tribsutils.a_get_realizations(a_session, project))[0]
    async with make_communicator(project.id) as communicator:
        assert realization.name == 'Tests Salas Run 10-20-30'
        assert realization.description == 'Results from run of Salas scenario.'
        data = {
            "id": str(realization.id),
            "name": "updated name",
            "description": "changed description",
            "attributes": {
                "foo": "bar",
            },
            'status': 'Dirty',
        }
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.REALIZATION_UPDATE,
                },
                "payload": data,
            }
        )
        response = await communicator.receive_json_from()
        assert response["action"]["type"] == BackendActions.REALIZATION_DATA
        payload = response["payload"]
        assert payload["id"] == data["id"]
        assert payload["name"] == data["name"]
        assert payload["description"] == data["description"]
        assert payload["status"] == data["status"]
        assert payload["attributes"]["foo"] == data["attributes"]["foo"]
        assert "input_file" not in payload["attributes"]  # input_file should be moved out of attributes


@pytest.mark.asyncio
async def test_realization_receive_update_invalid_vals(a_session, a_complete_project, make_communicator, tribsutils):
    action_id = str(uuid.uuid4())
    project = a_complete_project
    realization = (await tribsutils.a_get_realizations(a_session, project))[0]
    async with make_communicator(project.id) as communicator:
        assert realization.name == 'Tests Salas Run 10-20-30'
        assert realization.description == 'Results from run of Salas scenario.'
        data = {
            "id": str(realization.id),
            "name": "updated name 2",
            "description": "changed description 2",
            "attributes":
                {
                    # Input file should be ignored (read only on realizations)
                    "input_file": {
                        "garbage": "data"
                    },
                },
            'status': 'Foo',  # Invalid status
            'dne': 43,  # Non-extistant property
        }
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.REALIZATION_UPDATE,
                },
                "payload": data,
            }
        )
        response = await communicator.receive_json_from()
        assert response["action"]["type"] == BackendActions.REALIZATION_DATA
        payload = response["payload"]
        assert payload["id"] == data["id"]
        assert payload["name"] == data["name"]
        assert payload["description"] == data["description"]
        assert payload["status"] != data["status"]  # invalid status should be ignored
        assert "input_file" not in payload["attributes"]  # input_file should be moved out of attributes
        assert payload["input_file"] != data["attributes"]["input_file"]
        assert "garbage" not in payload["input_file"]
        assert "dne" not in payload
