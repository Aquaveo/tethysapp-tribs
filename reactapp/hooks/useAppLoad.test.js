import { renderHook, waitFor } from "@testing-library/react";
import WS from "jest-websocket-mock";
import { rest } from "msw";

import { server } from "config/tests/mocks/server";
import { useAppLoad } from "hooks/useAppLoad";
import { getAccessToken, getRefreshToken } from "react-tethys/services/api/tokens";

const PROJECT_ID = "12345678-90a1-4b2c-def3-4567ab8cd90e";
const PATHNAME = `/apps/tribs/project/${PROJECT_ID}/editor/`;

describe("useAppLoad", () => {
  beforeEach(() => {
    localStorage.clear();
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
    await waitFor(() => expect(result.current.isLoaded).toBe(true), {
      timeout: 3000,
    });

    expect(result.current.error).toBeNull();
    expect(result.current.appContext.jwtToken).toEqual({
      access: "fake-access",
      refresh: "fake-refresh",
    });
    expect(result.current.appContext.tethysApp.package).toBe("tribs");
    expect(result.current.appContext.user.username).toBe("jsmith");
    expect(result.current.appContext.backend).toBeDefined();

    // Tokens are stored for later use (Bearer header, WebSocket auth).
    expect(getAccessToken()).toBe("fake-access");
    expect(getRefreshToken()).toBe("fake-refresh");
  });

  it("redirects to login when /api/token/ returns null tokens", async () => {
    // Unauthenticated: /api/token/ responds 200 with nulls, not 401.
    server.use(
      rest.get("http://api.test/api/token/", (req, res, ctx) => {
        return res(ctx.status(200), ctx.json({ access: null, refresh: null }));
      })
    );

    const { result } = renderHook(() => useAppLoad());

    await waitFor(() =>
      expect(window.location.assign).toHaveBeenCalledWith(
        `/accounts/login?next=${PATHNAME}`
      )
    );
    expect(result.current.isLoaded).toBe(false);
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
