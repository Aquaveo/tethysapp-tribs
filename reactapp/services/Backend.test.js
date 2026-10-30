import newUUID from "lib/uuid";
import { toast } from "react-toastify";
import { setTokens } from "react-tethys/services/api/tokens";
import { mockBackend, mockBackendAfterEach } from "config/tests/mocks/backend";

afterEach(() => {
  mockBackendAfterEach();
});

it("Connects to backend through web socket.", async () => {
  const { server } = await mockBackend();
  expect(server).toHaveReceivedMessages([]);
});

it("Sends a prepare get project data action", async () => {
  const { server, backend } = await mockBackend();
  const actionId = backend.do(backend.actions.PROJECT_DATA, {
    initial: true,
  });
  const expectedMessage =
    `{"action":{"id":"${actionId}","type":"PROJECT_DATA"},"payload":{"initial":true}}`;
  await expect(server).toReceiveMessage(expectedMessage);
  expect(server).toHaveReceivedMessages([expectedMessage]);
});

it('Exclude object properties starting with "_" when serializing data', async () => {
  const { server, backend } = await mockBackend();
  const actionId = backend.do(backend.actions.PROJECT_DATA, {
    runId: "12345",
    simulation: { foo: "bar", _ignore: "me" },
  });
  const expectedMessage =
    `{"action":{"id":"${actionId}","type":"PROJECT_DATA"},"payload":{"runId":"12345","simulation":{"foo":"bar"}}}`;
  await expect(server).toReceiveMessage(expectedMessage);
  expect(server).toHaveReceivedMessages([expectedMessage]);
});

it("Calls a bound handler callback when message received", async () => {
  const { server, backend } = await mockBackend();
  const cb = jest.fn();
  backend.on(backend.actions.PROJECT_DATA, cb);
  server.send(
    JSON.stringify({
      action: {
        id: newUUID(),
        type: backend.actions.PROJECT_DATA,
      },
      payload: { runId: "12345", status: "foo" },
    })
  );
  expect(cb).toHaveBeenCalledWith({
    runId: "12345",
    status: "foo",
  });
});

it('Logs an error if "type" not included in message received', async () => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  const { server } = await mockBackend();
  const actionId = newUUID();
  server.send(
    JSON.stringify({
      action: {
        id: actionId,
      },
      payload: { runId: "12345", status: "foo" },
    })
  );
  expect(console.error).toHaveBeenCalled();
  expect(console.error.mock.calls[0][0]).toEqual(
    `Error: malformed message received: {"action":{"id":"${actionId}"},"payload":{"runId":"12345","status":"foo"}}`
  );
  console.error.mockRestore();
});

it('Logs an error if "payload" not included in message received', async () => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  const { server, backend } = await mockBackend();
  const actionId = newUUID();
  server.send(
    JSON.stringify({
      action: {
        id: actionId,
        type: backend.actions.PROJECT_DATA,
      },
    })
  );
  expect(console.error).toHaveBeenCalled();
  expect(console.error.mock.calls[0][0]).toEqual(
    `Error: malformed message received: {"action":{"id":"${actionId}","type":"PROJECT_DATA"}}`
  );
  console.error.mockRestore();
});

it("Logs a warning if no handler callback registered for type of message received", async () => {
  jest.spyOn(console, "warn").mockImplementation(() => {});
  const { server } = await mockBackend();
  server.send(
    JSON.stringify({
      action: {
        id: newUUID(),
        type: "FOO_BAR",
      },
      payload: { runId: "12345", status: "foo" },
    })
  );
  expect(console.warn).toHaveBeenCalled();
  expect(console.warn.mock.calls[0][0]).toEqual(
    'Warning: no handler found for message of type "FOO_BAR".'
  );
  console.warn.mockRestore();
});

it("Does not reconnect when server closes with 4403", async () => {
  const { server, backend } = await mockBackend();
  const reconnect = jest.spyOn(backend, "reconnect").mockImplementation(() => {});
  const errorToast = jest.spyOn(toast, "error").mockImplementation(() => {});
  server.close({ code: 4403, reason: "", wasClean: true });
  expect(reconnect).not.toHaveBeenCalled();
  expect(errorToast).toHaveBeenCalledWith(
    "You no longer have access to this project.", expect.anything()
  );
  errorToast.mockRestore();
});

it("Reconnects once on a normal close", async () => {
  const { server, backend } = await mockBackend();
  const reconnect = jest.spyOn(backend, "reconnect").mockImplementation(() => {});
  server.error({ code: 1006, reason: "", wasClean: false });
  expect(reconnect).toHaveBeenCalledTimes(1);
});

it("Re-authenticates the open socket when the access token is refreshed", async () => {
  const { server } = await mockBackend();
  setTokens("refreshed-token");
  const message = JSON.parse(await server.nextMessage);
  expect(message.action.type).toEqual("AUTHENTICATE");
  expect(message.payload).toEqual({ token: "refreshed-token" });
});

it("Does not send AUTHENTICATE when the token is refreshed while the socket is closed", async () => {
  const { server, backend } = await mockBackend();
  jest.spyOn(backend, "reconnect").mockImplementation(() => {});
  server.close();
  const send = jest.spyOn(backend.webSocket, "send");
  setTokens("refreshed-token");
  expect(send).not.toHaveBeenCalled();
});
