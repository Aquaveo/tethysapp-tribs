import WS from "jest-websocket-mock";
import Backend from "services/Backend";

const backends = []

const mockBackendAfterEach = () => {
  // Stop clients from earlier tests reconnecting into the next test's server.
  for (const backend of backends) {
    backend.webSocket?.removeEventListener("close", backend.reconnect);
    backend.webSocket?.removeEventListener("error", backend.reconnect);
  }
  backends.length = 0;
  WS.clean();
};

const mockBackend = async () => {
  const projectId = "12345678-90a1-4b2c-def3-4567ab8cd90e";
  const pathname = `/apps/foo/project/${projectId}/editor/`;
  // Backend connects to the websocket based on the current location pathname.
  Object.defineProperty(window, "location", {
    value: {
      pathname: pathname,
    },
  });
  // Setup test websocket server.
  const wsUrl = `ws://api.test${pathname}ws/`;
  const server = new WS(wsUrl);
  const backend = new Backend("");
  backends.push(backend);
  if (backend.wsUrl != wsUrl) {
    throw new Error(`Backend WS URL ${backend.wsUrl} does not match test server WS url: ${wsUrl}`);
  }
  let appContext = {};
  backend.connect(() => {
    appContext = {
      backend,
    };
  });
  await server.connected;
  // The client sends AUTHENTICATE first. Consume it and reply so
  // onConnectCallback fires and later tests see their own message next.
  await server.nextMessage;
  server.send(JSON.stringify({
    action: { id: "auth", type: "AUTHENTICATED" },
    payload: { authenticated: true },
  }));
  return { server, backend, projectId, wsUrl, pathname, appContext };
};

export { mockBackend, mockBackendAfterEach };