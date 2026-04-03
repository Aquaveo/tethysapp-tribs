import datetime
import uuid

import pytest

from tethysapp.tribs.consumers.backend_actions import BackendActions


@pytest.mark.asyncio
async def test_backend_connect(a_empty_project, make_communicator):
    async with make_communicator(a_empty_project.id, connect=False) as communicator:
        connected, _ = await communicator.connect()
        assert connected


@pytest.mark.asyncio
async def test_action_type_missing(a_complete_project, make_communicator):
    action_id = str(uuid.uuid4())
    payload = {"foo": "bar"}
    async with make_communicator(a_complete_project.id) as communicator:
        await communicator.send_json_to({
            "action": {
                "id": action_id,
                "type": None,
            },
            "payload": payload
        })
        response = await communicator.receive_json_from()
        assert response["action"]["type"] == BackendActions.MESSAGE_ERROR
        r_payload = response["payload"]
        assert r_payload[
            "message"
        ] == 'Malformed message received: ' \
             f'{{"action": {{"id": "{action_id}", "type": null}}, "payload": {{"foo": "bar"}}}}'
        assert r_payload["received"]["action"]["id"] == action_id
        assert r_payload["received"]["action"]["type"] is None
        assert r_payload["received"]["payload"] == payload


@pytest.mark.asyncio
async def test_action_payload_missing(a_complete_project, make_communicator):
    action_id = str(uuid.uuid4())
    async with make_communicator(a_complete_project.id) as communicator:
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.PROJECT_DATA,
                },
                "payload": None
            }
        )
        response = await communicator.receive_json_from()
        assert response["action"]["type"] == BackendActions.MESSAGE_ERROR
        r_payload = response["payload"]
        assert r_payload[
            "message"
        ] == 'Malformed message received: ' \
             f'{{"action": {{"id": "{action_id}", "type": "PROJECT_DATA"}}, "payload": null}}'
        assert r_payload["received"]["action"]["id"] == action_id
        assert r_payload["received"]["action"]["type"] == BackendActions.PROJECT_DATA
        assert r_payload["received"]["payload"] is None


@pytest.mark.asyncio
async def test_action_dne(a_complete_project, make_communicator):
    action_id = str(uuid.uuid4())
    payload = {"foo": "bar"}
    async with make_communicator(a_complete_project.id) as communicator:
        await communicator.send_json_to({
            "action": {
                "id": action_id,
                "type": "I_DONT_EXIST",
            },
            "payload": payload
        })
        response = await communicator.receive_json_from()
        assert response["action"]["type"] == BackendActions.MESSAGE_ERROR
        r_payload = response["payload"]
        assert r_payload["message"] == 'Unhandled message type received: "I_DONT_EXIST"'
        assert r_payload["received"]["action"]["id"] == action_id
        assert r_payload["received"]["action"]["type"] == "I_DONT_EXIST"
        assert r_payload["received"]["payload"] == payload


@pytest.mark.asyncio
async def test_receive_project_data(a_complete_project, make_communicator):
    action_id = str(uuid.uuid4())
    async with make_communicator(a_complete_project.id) as communicator:
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.PROJECT_DATA,
                },
                "payload": {
                    "id": str(a_complete_project.id)
                }
            }
        )
        response = await communicator.receive_json_from()
        assert response["action"]["type"] == BackendActions.PROJECT_DATA
        payload = response["payload"]
        assert payload["id"] == str(a_complete_project.id)


@pytest.mark.asyncio
async def test_receive_project_data_dne(make_communicator):
    action_id = str(uuid.uuid4())
    project_id = '00000000-0000-0000-0000-000000000000'  # Does not exist
    payload = {"id": project_id}
    async with make_communicator(project_id) as communicator:
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.PROJECT_DATA,
                },
                "payload": payload
            }
        )
        response = await communicator.receive_json_from()
        assert response["action"]["type"] == "MESSAGE_ERROR"
        r_payload = response["payload"]
        assert r_payload["received"]["action"]["type"] == BackendActions.PROJECT_DATA
        assert r_payload["received"]["action"]["id"] == action_id
        assert r_payload["message"] == f'Could not find Project with ID "{project_id}"'
        assert r_payload["received"]["payload"] == payload
        assert r_payload["details"] is None


@pytest.mark.asyncio
async def test_receive_bytes(a_complete_project, make_communicator):
    action_id = str(uuid.uuid4())
    async with make_communicator(a_complete_project.id) as communicator:
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.PROJECT_DATA,
                },
                "payload": {
                    "id": str(a_complete_project.id)
                }
            }
        )
        response = await communicator.receive_json_from()
        assert response["action"]["type"] == BackendActions.PROJECT_DATA
        payload = response["payload"]
        assert payload["id"] == str(a_complete_project.id)


def test_json_serializer():
    from tethysapp.tribs.consumers.backend import BackendConsumer
    backend = BackendConsumer()
    a_uuid = uuid.uuid4()
    assert backend._json_serializer(a_uuid) == str(a_uuid)
    assert backend._json_serializer(datetime.datetime(2024, 2, 15)) == '2024-02-15T00:00:00'
