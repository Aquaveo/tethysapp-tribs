import { waitFor } from "@testing-library/react";
import { rest } from "msw";

import { server } from "config/tests/mocks/server";
import { scheduleRefresh } from "react-tethys/services/api/client";
import {
  getAccessToken,
  setTokens,
  clearTokens,
} from "react-tethys/services/api/tokens";

const PATHNAME = "/apps/tribs/";

// Build a fake JWT (base64url payload) expiring in the given number of seconds.
function makeToken(expiresInSeconds) {
  const payload = btoa(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expiresInSeconds })
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `fake-header.${payload}.fake-signature`;
}

describe("scheduleRefresh", () => {
  beforeEach(() => {
    clearTokens();
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
    // Passing an invalid token clears the module-level timer without arming a new one.
    scheduleRefresh("not-a-jwt");
    jest.restoreAllMocks();
  });

  it("arms a timer for ~60s before the access token expires", () => {
    const setTimeoutSpy = jest.spyOn(global, "setTimeout");

    scheduleRefresh(makeToken(120));

    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
    const delay = setTimeoutSpy.mock.calls[0][1];
    expect(delay).toBeGreaterThan(55_000);
    expect(delay).toBeLessThanOrEqual(60_000);
  });

  it("does not arm a timer for an invalid token", () => {
    const setTimeoutSpy = jest.spyOn(global, "setTimeout");

    scheduleRefresh("not-a-jwt");

    expect(setTimeoutSpy).not.toHaveBeenCalled();
  });

  it("refreshes immediately when the token expires within 60s and stores the new access token", async () => {
    const newAccess = makeToken(300);
    server.use(
      rest.get("http://api.test/api/token/", (req, res, ctx) => {
        // Session-authenticated: the portal issues a fresh pair; the client keeps only access.
        return res(ctx.status(200), ctx.json({ access: newAccess, refresh: "ignored" }));
      })
    );
    setTokens("old-access");

    scheduleRefresh(makeToken(30)); // < 60s to expiry, so delay clamps to 0

    await waitFor(() => expect(getAccessToken()).toBe(newAccess));
  });

  it("re-arms the timer after a successful refresh", async () => {
    const setTimeoutSpy = jest.spyOn(global, "setTimeout");
    server.use(
      rest.get("http://api.test/api/token/", (req, res, ctx) => {
        return res(ctx.status(200), ctx.json({ access: makeToken(300) }));
      })
    );
    setTokens("old-access");

    scheduleRefresh(makeToken(30));

    // One call arms the initial (immediate) refresh; a second call means the
    // new token was scheduled after the refresh completed.
    await waitFor(() =>
      expect(
        setTimeoutSpy.mock.calls.filter(([, delay]) => delay > 100_000).length
      ).toBe(1)
    );
  });

  it("redirects to portal login when the session has expired", async () => {
    // Unauthenticated: /api/token/ responds 200 with nulls, not 401.
    server.use(
      rest.get("http://api.test/api/token/", (req, res, ctx) => {
        return res(ctx.status(200), ctx.json({ access: null, refresh: null }));
      })
    );
    setTokens("old-access");

    scheduleRefresh(makeToken(30));

    await waitFor(() => expect(window.location.assign).toHaveBeenCalled());
    expect(window.location.assign.mock.calls[0][0]).toContain(
      `/accounts/login?next=${PATHNAME}`
    );
  });

  it("redirects to portal login when the refresh request fails", async () => {
    server.use(
      rest.get("http://api.test/api/token/", (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );
    setTokens("old-access");

    scheduleRefresh(makeToken(30));

    await waitFor(() => expect(window.location.assign).toHaveBeenCalled());
    expect(window.location.assign.mock.calls[0][0]).toContain(
      `/accounts/login?next=${PATHNAME}`
    );
  });
});
