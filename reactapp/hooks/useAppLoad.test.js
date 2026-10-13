import { renderHook, waitFor } from "@testing-library/react";
import WS from "jest-websocket-mock";
import { rest } from "msw";

import { server } from "config/tests/mocks/server";
import { useAppLoad } from "hooks/useAppLoad";
import { getAccessToken, clearTokens } from "react-tethys/services/api/tokens";

const PROJECT_ID = "12345678-90a1-4b2c-def3-4567ab8cd90e";
const PATHNAME = `/apps/tribs/project/${PROJECT_ID}/editor/`;

describe("useAppLoad", () => {
  beforeEach(() => {
    clearTokens();
    // Backend builds its WS URL from the current location pathname.
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        pathname: PATHNAME,
        protocol: "http:",
        assign: jest.fn(),
      },
    });
  });

  afterEach(() => {
    WS.clean();
  });

  it("fetches JWT tokens, connects the backend, and loads the app", async () => {
    const wsServer = new WS(`ws://api.test${PATHNAME}ws/`);

    const { result } = renderHook(() => useAppLoad());

    await wsServer.connected;

    // Client send the first message AUTHENTICATEW with an access token
    const authMessage = JSON.parse(await wsServer.nextMessage);
    expect(authMessage.action.type).toBe("AUTHENTICATE");
    expect(authMessage.payload.token).toBe("fake-access");

    // Reply so the connect callback fires and the app loads.
    wsServer.send(JSON.stringify({
      action: { id: "auth", type: "AUTHENTICATED" },
      payload: { authenticated: true },
    }));

    await waitFor(() => expect(result.current.isLoaded).toBe(true), {
      timeout: 3000,
    });

    expect(result.current.error).toBeNull();
    expect(result.current.appContext.jwtToken).toEqual({
      access: "fake-access",
    });
    expect(result.current.appContext.tethysApp.package).toBe("tribs");
    expect(result.current.appContext.user.username).toBe("jsmith");
    expect(result.current.appContext.backend).toBeDefined();

    // Tokens are stored for later use (Bearer header, WebSocket auth).
    expect(getAccessToken()).toBe("fake-access");
  });

  it("redirects to login when /api/token/ returns null tokens", async () => {
    // Unauthenticated: /api/token/ responds 200 with nulls, not 401.
    server.use(
      rest.get("http://api.test/api/token/", (req, res, ctx) => {
        return res(ctx.status(200), ctx.json({ access: null }));
      })
    );

    const { result } = renderHook(() => useAppLoad());

    await waitFor(() =>
      expect(window.location.assign).toHaveBeenCalledWith(
        `http://api.test/accounts/login?next=${PATHNAME}`
      )
    );
    expect(result.current.isLoaded).toBe(false);
  });

  it("redirects to login on visibilitychange when the session is gone", async () => {
    const wsServer = new WS(`ws://api.test${PATHNAME}ws/`);
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });

    const { result } = renderHook(() => useAppLoad());

    await wsServer.connected;
    await wsServer.nextMessage;
    wsServer.send(JSON.stringify({
      action: { id: "auth", type: "AUTHENTICATED" },
      payload: { authenticated: true },
    }));
    await waitFor(() => expect(result.current.isLoaded).toBe(true), {
      timeout: 3000,
    });
    expect(window.location.assign).not.toHaveBeenCalled();

    // Session deleted: /api/token/ now responds 200 with nulls.
    server.use(
      rest.get("http://api.test/api/token/", (req, res, ctx) => {
        return res(ctx.status(200), ctx.json({ access: null, refresh: null }));
      })
    );

    window.dispatchEvent(new Event("visibilitychange"));

    await waitFor(() => expect(window.location.assign).toHaveBeenCalled());
    expect(window.location.assign.mock.calls[0][0]).toContain(
      `/accounts/login?next=${PATHNAME}`
    );
  });

  it("sets error when an API call fails", async () => {
    server.use(
      rest.get("http://api.test/api/whoami/", (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    const { result } = renderHook(() => useAppLoad());

    await waitFor(() => expect(result.current.error).not.toBeNull(), {
      timeout: 3000,
    });
    expect(result.current.isLoaded).toBe(false);
  });
});
