"""Raise Daphne's WebSocket size limits.

daphne >= 4 defaults websocket_max_message_size / _max_frame_size to 1 MB
(daphne 3.x had no limit). tRIBS streams files over the WebSocket, so the
1 MB cap breaks large uploads. Neither `tethys start` (runserver) nor the
production daphne command exposes these, so we raise them at import time.
This module is imported from tethysapp/tribs/__init__.py, which Django loads
during django.setup() — before Daphne constructs its Server in either path.
"""
import logging

log = logging.getLogger(__name__)

# Generous ceiling above the largest expected upload. Do NOT use 0 (unlimited):
# daphne warns that disables the limit and invites memory-exhaustion DoS.
MAX_WS_SIZE = 64 * 1024 * 1024  # 64 MB


def raise_daphne_ws_limits(max_size: int = MAX_WS_SIZE) -> None:
    try:
        from daphne.server import Server
    except ImportError:
        return  # daphne not installed (e.g. WSGI-only) — nothing to do

    if getattr(Server, "_tribs_ws_limit_patched", False):
        return

    original_init = Server.__init__

    def patched_init(self, *args, **kwargs):
        # Only ever raise the ceiling; never lower an explicitly larger value,
        # and leave 0 (intentionally unlimited) untouched.
        for key in ("websocket_max_message_size", "websocket_max_frame_size"):
            current = kwargs.get(key)
            if current is None or (isinstance(current, int) and 0 < current < max_size):
                kwargs[key] = max_size
        original_init(self, *args, **kwargs)

    Server.__init__ = patched_init
    Server._tribs_ws_limit_patched = True
    log.info("Raised Daphne WebSocket message/frame size limit to %d bytes", max_size)
