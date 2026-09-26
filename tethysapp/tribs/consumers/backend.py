import datetime
import json
import logging
import queue
import uuid

from channels.consumer import AsyncConsumer
from channels.db import database_sync_to_async
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from tethys_sdk.routing import consumer

from .backend_actions import BackendActions
from .handlers import (
    DatasetBackendHandler, FileBackendHandler, ProjectBackendHandler, RealizationBackendHandler, ScenarioBackendHandler,
    WorkflowBackendHandler
)
from tethysapp.tribs.app import Tribs as app

from urllib.parse import parse_qs
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken

log = logging.getLogger(__name__)


@database_sync_to_async
def _get_user_from_jwt(token_str):
    """Resolve the user from a JWT and return (user, exp).

    Returns (None, None) if the token is invalid/expired or the account is inactive.
    The exp (access-token expiry, unix seconds) is stored on the connection so the
    live socket can be closed once the token would have expired.
    """
    try:
        token = AccessToken(token_str)  # verifies signature and expiry
        user = get_user_model().objects.get(pk=token["user_id"])
    except (TokenError, KeyError, get_user_model().DoesNotExist):
        return None, None
    if not user.is_active:
        return None, None
    return user, token["exp"]


@database_sync_to_async
def _user_can_access_project(user, project_id, ws_path):
    """
    Same authorization check the HTTP views perform (AppUser.can_view).
    Organization users can edit the project they can view, so this check is sufficient for the websocket connection.
    """
    from django.http import HttpRequest
    from tribs_adapter.app_users import TribsAppUser
    from tribs_adapter.resources import Project

    Session = app.get_persistent_store_database(app.DATABASE_NAME, as_sessionmaker=True)
    session = Session()
    try:
        username = TribsAppUser.STAFF_USERNAME if user.is_staff else user.username
        app_user = session.query(TribsAppUser).filter(TribsAppUser.username == username).one_or_none()
        if app_user is None:
            return False
        # A user disabled via the app's Modify User page has app_user.is_active=False
        # (Django's auth_user.is_active is left untouched), so check it here.
        if not app_user.is_active:
            return False
        project = session.query(Project).get(project_id)
        if project is None:
            return False
        # can_view only uses the request to resolve the active app for has_permission
        request = HttpRequest()
        request.user = user
        request.path = ws_path
        return app_user.can_view(session, request, project)
    except Exception:
        log.exception("Project access check failed for '%s'", user.username)
        return False
    finally:
        session.close()


@consumer(name="project-editor-backend", url="project/{resource_id}/editor/")
class BackendConsumer(AsyncConsumer):
    channel_layer_alias = app.package
    file_q = queue.Queue()

    async def websocket_connect(self, event):
        self.token_exp = None
        query = parse_qs(self.scope.get("query_string", b"").decode())
        token = next(iter(query.get("token", [])), None)
        if token:
            # A JWT was supplied: it is authoritative so its expiry can be enforced on
            # the live connection, even though AuthMiddlewareStack also populates
            # scope["user"] from the Django session cookie. Without this, a session-
            # authenticated socket would never honor the token's expiry.
            user, self.token_exp = await _get_user_from_jwt(token)
        else:
            user = self.scope.get("user")
        if user is None or not user.is_authenticated:
            await self.send({"type": "websocket.close", "code": 4401})
            return
        self.scope["user"] = user

        self.project_id = self.scope['url_route']['kwargs']['resource_id']
        if not await _user_can_access_project(user, self.project_id, self.scope.get("path")):
            await self.send({"type": "websocket.close", "code": 4403})
            return

        self.sessionmaker = None
        db_url = await database_sync_to_async(
            app.get_persistent_store_database,
            thread_sensitive=True,
        )(app.DATABASE_NAME, as_url=True)
        # Specify the async driver for postgresql
        db_url = str(db_url).replace('postgresql', 'postgresql+asyncpg')
        self.engine = create_async_engine(db_url, connect_args={'ssl': False})
        self.sessionmaker = sessionmaker(self.engine, expire_on_commit=False, class_=AsyncSession)
        self.handlers = (
            DatasetBackendHandler(self),
            FileBackendHandler(self),
            ProjectBackendHandler(self),
            RealizationBackendHandler(self),
            ScenarioBackendHandler(self),
            WorkflowBackendHandler(self),
        )
        # Join channel group
        self.group_name = f"project_editor_{self.project_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)

        # Accept the connection
        await self.send({
            "type": "websocket.accept",
        })
        log.debug("-----------WebSocket Connected-----------")

    async def websocket_disconnect(self, close_code):
        if getattr(self, "engine", None):
            await self.engine.dispose()
        if getattr(self, "group_name", None):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        log.debug("-----------WebSocket Disconnected-----------")

    async def websocket_receive(self, event):
        # Enforce access-token expiry on the live connection. Once the token that
        # authenticated this socket has expired, close with 4401 so the client must
        # reconnect with a fresh token, which re-runs the connect-time auth checks.
        token_exp = getattr(self, "token_exp", None)
        if token_exp is not None and \
                datetime.datetime.now(datetime.timezone.utc).timestamp() >= token_exp:
            await self.send({"type": "websocket.close", "code": 4401})
            return
        try:
            if "text" in event:
                data = json.loads(event.get("text"))
                message_action = data.get("action", {})
                message_type = message_action.get("type")
                message_data = data.get("payload")

                if not message_action or not message_type or not message_data:
                    msg = f"Malformed message received: {event.get('text', 'no text in message')}"
                    log.error(msg)
                    await self.send_error(msg, message_action, message_data)
                    return

                # Look up the handler for the message type and call the appropriate method
                handler_found = False
                for handler in self.handlers:
                    if message_type in handler.receiving_actions:
                        handler_found = True
                        await handler.receiving_actions[message_type](
                            event=event,
                            action=message_action,
                            data=message_data,
                        )
                        break

                if not handler_found:
                    msg = f'Unhandled message type received: "{message_type}"'
                    log.warning(msg)
                    await self.send_error(msg, message_action, message_data)

        except Exception:
            event_summary = (event if "bytes" not in event else f"BYTES: {len(event['bytes'])}")
            log.exception(f"An unexpected error occurred: {event_summary}")

    async def send_action(self, action: BackendActions, payload):
        message = {
            "type":
                "websocket.send",
            "text":
                json.dumps(
                    {
                        "action": {
                            "id": str(uuid.uuid4()),
                            "type": str(action),
                        },
                        "payload": payload
                    },
                    default=self._json_serializer
                ),
        }
        await self.send(message)

    async def send_acknowledge(self, msg: str, action: BackendActions, payload: dict, details: dict = None):
        """Send an acknowledge message to the frontend.

        Args:
            msg: The acknowledge message.
            action: The received action during which the error occurred.
            payload: The payload received with the received action.
            details: Additional details about the acknowledge message.
        """
        ack_dict = {
            'message': msg,
            'received': {
                'action': action,
                'payload': payload,
            },
            'details': details,
        }
        await self.send_action(BackendActions.MESSAGE_ACKNOWLEDGE, ack_dict)

    async def send_error(self, msg: str, action: dict, payload: dict, details: dict = None):
        """Send an error message to the frontend.

        Args:
            msg: The error message.
            action: The received action during which the error occurred.
            payload: The payload received with the received action.
            details: Additional details about the error message.
        """
        err_dict = {
            'message': msg,
            'received': {
                'action': action,
                'payload': payload,
            },
            'details': details,
        }
        await self.send_action(BackendActions.MESSAGE_ERROR, err_dict)

    @staticmethod
    def _json_serializer(obj):
        if isinstance(obj, uuid.UUID):
            return str(obj)
        elif isinstance(obj, (datetime.datetime, datetime.date)):
            return obj.isoformat()
