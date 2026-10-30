import datetime
import uuid
from unittest import mock

import pytest
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken

from tethysapp.tribs.consumers.backend import BackendConsumer, _get_user_from_jwt
from tethysapp.tribs.consumers.backend_actions import BackendActions


@pytest.mark.asyncio
async def test_backend_connect(a_empty_project, make_communicator, a_admin_user):
    async with make_communicator(a_empty_project.id, authenticate=False) as communicator:
        token = str(await database_sync_to_async(AccessToken.for_user)(a_admin_user))
        await communicator.send_json_to(
            {
                "action": {
                    "id": str(uuid.uuid4()),
                    "type": BackendActions.AUTHENTICATE
                },
                "payload": {
                    "token": token
                },
            }
        )
        response = await communicator.receive_json_from()
        assert response["action"]["type"] == BackendActions.AUTHENTICATED
        assert response["payload"] == {"authenticated": True}


@pytest.mark.asyncio
async def test_backend_connect_no_user(a_empty_project, make_communicator):
    async with make_communicator(a_empty_project.id, user=False) as communicator:
        await communicator.send_json_to(
            {
                "action": {
                    "id": str(uuid.uuid4()),
                    "type": BackendActions.AUTHENTICATE
                },
                "payload": {
                    "token": "not.a.valid.token"
                },
            }
        )
        event = await communicator.receive_output()
        assert event == {"type": "websocket.close", "code": 4401}


@pytest.mark.asyncio
async def test_backend_connect_unauthorized(a_empty_project, make_communicator, a_admin_user):
    async with make_communicator(a_empty_project.id, authorized=False, authenticate=False) as communicator:
        token = str(await database_sync_to_async(AccessToken.for_user)(a_admin_user))
        await communicator.send_json_to(
            {
                "action": {
                    "id": str(uuid.uuid4()),
                    "type": BackendActions.AUTHENTICATE
                },
                "payload": {
                    "token": token
                },
            }
        )
        event = await communicator.receive_output()
        assert event == {"type": "websocket.close", "code": 4403}


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


def _authenticated_consumer(mocker, jwt_user, jwt_exp, can_access=True):
    """An already-authenticated consumer whose token check and access check return the given values."""
    consumer = BackendConsumer()
    consumer.send = mock.AsyncMock()
    consumer.authenticated = True
    consumer.handlers = ()
    consumer.project_id = 'a-project-id'
    consumer.scope = {'user': mock.Mock(pk=1), 'path': '/apps/tribs/project/a-project-id/editor/ws/'}
    consumer.token_exp = datetime.datetime.now(datetime.timezone.utc).timestamp() + 30
    mocker.patch(
        'tethysapp.tribs.consumers.backend._get_user_from_jwt',
        new=mock.AsyncMock(return_value=(jwt_user, jwt_exp)),
    )
    mocker.patch(
        'tethysapp.tribs.consumers.backend._user_can_access_project',
        new=mock.AsyncMock(return_value=can_access),
    )
    return consumer


def _authenticate_event(token='a.refreshed.token'):
    return {'text': f'{{"action": {{"type": "AUTHENTICATE"}}, "payload": {{"token": "{token}"}}}}'}


@pytest.mark.asyncio
async def test_reauthenticate_updates_token_exp(mocker):
    """A refreshed token on an open socket moves the expiry forward without closing or replying."""
    new_exp = datetime.datetime.now(datetime.timezone.utc).timestamp() + 300
    consumer = _authenticated_consumer(mocker, jwt_user=mock.Mock(pk=1), jwt_exp=new_exp)

    await consumer.websocket_receive(_authenticate_event())

    assert consumer.token_exp == new_exp
    consumer.send.assert_not_called()


@pytest.mark.asyncio
@pytest.mark.parametrize('jwt_user', [None, mock.Mock(pk=2)], ids=['invalid_token', 'other_user'])
async def test_reauthenticate_rejected_closes_4401(mocker, jwt_user):
    """An invalid token, or a valid token for a different user, closes the socket and keeps the old expiry."""
    new_exp = None if jwt_user is None else datetime.datetime.now(datetime.timezone.utc).timestamp() + 300
    consumer = _authenticated_consumer(mocker, jwt_user=jwt_user, jwt_exp=new_exp)
    old_exp = consumer.token_exp

    await consumer.websocket_receive(_authenticate_event())

    consumer.send.assert_awaited_once_with({'type': 'websocket.close', 'code': 4401})
    assert consumer.token_exp == old_exp


@pytest.mark.asyncio
async def test_reauthenticate_without_project_access_closes_4403(mocker):
    """A refreshed token for a user who lost access to the project closes the socket with 4403."""
    new_exp = datetime.datetime.now(datetime.timezone.utc).timestamp() + 300
    consumer = _authenticated_consumer(mocker, jwt_user=mock.Mock(pk=1), jwt_exp=new_exp, can_access=False)
    old_exp = consumer.token_exp

    await consumer.websocket_receive(_authenticate_event())

    consumer.send.assert_awaited_once_with({'type': 'websocket.close', 'code': 4403})
    assert consumer.token_exp == old_exp


@pytest.mark.asyncio
async def test_reauthenticate_without_token_closes_4401(mocker):
    """An AUTHENTICATE with an empty token on an open socket closes it with 4401."""
    consumer = _authenticated_consumer(mocker, jwt_user=mock.Mock(pk=1), jwt_exp=None)

    await consumer.websocket_receive(_authenticate_event(token=''))

    consumer.send.assert_awaited_once_with({'type': 'websocket.close', 'code': 4401})


@pytest.mark.asyncio
async def test_connect_with_expired_token_rejected(a_empty_project, make_communicator, a_admin_user):
    """An expired JWT is rejected at the handshake with 4401."""
    async with make_communicator(a_empty_project.id, authenticate=False) as communicator:
        token = await database_sync_to_async(AccessToken.for_user)(a_admin_user)
        token.set_exp(from_time=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=5))
        await communicator.send_json_to(
            {
                "action": {
                    "id": str(uuid.uuid4()),
                    "type": BackendActions.AUTHENTICATE
                },
                "payload": {
                    "token": str(token)
                },
            }
        )
        event = await communicator.receive_output()
        assert event == {"type": "websocket.close", "code": 4401}


@pytest.mark.asyncio
async def test_message_before_auth_rejected(a_empty_project, make_communicator):
    async with make_communicator(a_empty_project.id, authenticate=False) as communicator:
        await communicator.send_json_to(
            {
                "action": {
                    "id": str(uuid.uuid4()),
                    "type": BackendActions.PROJECT_DATA
                },
                "payload": {
                    "initial": True
                },
            }
        )
        event = await communicator.receive_output()
        assert event == {"type": "websocket.close", "code": 4401}


@pytest.mark.asyncio
async def test_auth_timeout_closes_socket(a_empty_project, make_communicator, mocker):
    mocker.patch("tethysapp.tribs.consumers.backend.AUTH_TIMEOUT_SECONDS", 0.1)
    async with make_communicator(a_empty_project.id, authenticate=False) as communicator:
        event = await communicator.receive_output(timeout=2)
        assert event == {"type": "websocket.close", "code": 4401}
