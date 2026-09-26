import datetime
import uuid
from unittest import mock

import pytest
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken

from tethysapp.tribs.consumers.backend import BackendConsumer, _get_user_from_jwt
from tethysapp.tribs.consumers.backend_actions import BackendActions


@pytest.mark.asyncio
async def test_backend_connect(a_empty_project, make_communicator):
    async with make_communicator(a_empty_project.id, connect=False) as communicator:
        connected, _ = await communicator.connect()
        assert connected


@pytest.mark.asyncio
async def test_backend_connect_no_user(a_empty_project, make_communicator):
    async with make_communicator(a_empty_project.id, connect=False, user=False) as communicator:
        connected, close_code = await communicator.connect()
        assert not connected
        assert close_code == 4401


@pytest.mark.asyncio
async def test_backend_connect_unauthorized(a_empty_project, make_communicator):
    async with make_communicator(a_empty_project.id, connect=False, authorized=False) as communicator:
        connected, close_code = await communicator.connect()
        assert not connected
        assert close_code == 4403


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


@pytest.mark.asyncio
async def test_get_user_from_jwt_valid(a_admin_user):
    """A valid access token resolves to the user and returns its expiry."""
    token = await database_sync_to_async(AccessToken.for_user)(a_admin_user)

    user, exp = await _get_user_from_jwt(str(token))

    assert user is not None
    assert user.pk == a_admin_user.pk
    assert exp == token['exp']


@pytest.mark.asyncio
async def test_get_user_from_jwt_invalid(a_admin_user):
    """A malformed/invalid token yields (None, None)."""
    user, exp = await _get_user_from_jwt('not.a.valid.token')

    assert user is None
    assert exp is None


@pytest.mark.asyncio
async def test_get_user_from_jwt_inactive_user(a_admin_user):
    """A token for a disabled account is rejected, even though the token itself is valid."""
    token = await database_sync_to_async(AccessToken.for_user)(a_admin_user)
    a_admin_user.is_active = False
    await database_sync_to_async(a_admin_user.save)()

    user, exp = await _get_user_from_jwt(str(token))

    assert user is None
    assert exp is None


@pytest.mark.asyncio
async def test_receive_closes_on_expired_token():
    """An open socket whose token has expired is closed with 4401 on the next message."""
    consumer = BackendConsumer()
    consumer.send = mock.AsyncMock()
    consumer.token_exp = datetime.datetime.now(datetime.timezone.utc).timestamp() - 100

    await consumer.websocket_receive({'text': '{"action": {"type": "PROJECT_DATA"}, "payload": {"x": 1}}'})

    consumer.send.assert_awaited_once_with({'type': 'websocket.close', 'code': 4401})


@pytest.mark.asyncio
async def test_receive_allowed_before_token_expiry():
    """A message on a socket whose token is still valid is not closed by the expiry check."""
    consumer = BackendConsumer()
    consumer.send = mock.AsyncMock()
    consumer.token_exp = datetime.datetime.now(datetime.timezone.utc).timestamp() + 100

    # Empty event (no "text") exercises only the expiry gate, not the message handling.
    await consumer.websocket_receive({})

    consumer.send.assert_not_called()


@pytest.mark.asyncio
async def test_connect_with_token_is_authoritative(a_empty_project, a_admin_user, mock_backend_app_get_ps_db, mocker):
    """A JWT supplied in the URL authenticates the socket even with no session user,
    so its expiry can later be enforced on the live connection."""
    from channels.routing import URLRouter
    from channels.testing import WebsocketCommunicator
    from django.urls import path

    mocker.patch(
        'tethysapp.tribs.consumers.backend._user_can_access_project',
        new=mock.AsyncMock(return_value=True),
    )
    token = await database_sync_to_async(AccessToken.for_user)(a_admin_user)
    application = URLRouter([
        path("apps/tribs/project/<resource_id>/editor/ws/", BackendConsumer.as_asgi()),
    ])
    communicator = WebsocketCommunicator(
        application,
        f"/apps/tribs/project/{a_empty_project.id}/editor/ws/?token={token}",
    )
    try:
        connected, _ = await communicator.connect()
        assert connected
    finally:
        await communicator.disconnect()


@pytest.mark.asyncio
async def test_connect_with_expired_token_rejected(a_empty_project, a_admin_user, mock_backend_app_get_ps_db, mocker):
    """An expired JWT is rejected at the handshake with 4401."""
    from channels.routing import URLRouter
    from channels.testing import WebsocketCommunicator
    from django.urls import path

    mocker.patch(
        'tethysapp.tribs.consumers.backend._user_can_access_project',
        new=mock.AsyncMock(return_value=True),
    )
    token = await database_sync_to_async(AccessToken.for_user)(a_admin_user)
    token.set_exp(from_time=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=5))
    application = URLRouter([
        path("apps/tribs/project/<resource_id>/editor/ws/", BackendConsumer.as_asgi()),
    ])
    communicator = WebsocketCommunicator(
        application,
        f"/apps/tribs/project/{a_empty_project.id}/editor/ws/?token={token}",
    )
    try:
        connected, close_code = await communicator.connect()
        assert not connected
        assert close_code == 4401
    finally:
        await communicator.disconnect()
