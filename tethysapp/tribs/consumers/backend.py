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

log = logging.getLogger(__name__)


@consumer(name="project-editor-backend", url="project/{resource_id}/editor/")
class BackendConsumer(AsyncConsumer):
    channel_layer_alias = app.package

    file_q = queue.Queue()

    async def websocket_connect(self, event):
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
        self.project_id = self.scope['url_route']['kwargs']['resource_id']
        self.group_name = f"project_editor_{self.project_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)

        # Accept the connection
        await self.send({
            "type": "websocket.accept",
        })
        log.debug("-----------WebSocket Connected-----------")

    async def websocket_disconnect(self, close_code):
        self.engine and await self.engine.dispose()
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        log.debug("-----------WebSocket Disconnected-----------")

    async def websocket_receive(self, event):
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
