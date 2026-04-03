import WS from "jest-websocket-mock";

import Backend from "services/Backend";

const mockBackendAfterEach = () => {
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
  return { server, backend, projectId, wsUrl, pathname, appContext };
};

export { mockBackend, mockBackendAfterEach };