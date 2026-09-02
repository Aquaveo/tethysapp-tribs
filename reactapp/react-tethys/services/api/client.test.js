import { waitFor } from "@testing-library/react";
import { rest } from "msw";

import { server } from "config/tests/mocks/server";
import { scheduleRefresh } from "react-tethys/services/api/client";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
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
    localStorage.clear();
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
    let sentRefresh = null;
    const rotatedAccess = makeToken(300);
    server.use(
      rest.post("http://api.test/api/token/refresh/", async (req, res, ctx) => {
        sentRefresh = (await req.json()).refresh;
        return res(ctx.status(200), ctx.json({ access: rotatedAccess }));
      })
    );
    setTokens("old-access", "stored-refresh");

    scheduleRefresh(makeToken(30)); // < 60s to expiry, so delay clamps to 0

    await waitFor(() => expect(getAccessToken()).toBe(rotatedAccess));
    // The refresh request sends the stored refresh token.
    expect(sentRefresh).toBe("stored-refresh");
    // Without rotation, the stored refresh token is left untouched.
    expect(getRefreshToken()).toBe("stored-refresh");
  });

  it("stores a rotated refresh token when the server returns one", async () => {
    server.use(
      rest.post("http://api.test/api/token/refresh/", (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({ access: makeToken(300), refresh: "rotated-refresh" })
        );
      })
    );
    setTokens("old-access", "stored-refresh");

    scheduleRefresh(makeToken(30));

    await waitFor(() => expect(getRefreshToken()).toBe("rotated-refresh"));
  });

  it("re-arms the timer after a successful refresh", async () => {
    const setTimeoutSpy = jest.spyOn(global, "setTimeout");
    server.use(
      rest.post("http://api.test/api/token/refresh/", (req, res, ctx) => {
        return res(ctx.status(200), ctx.json({ access: makeToken(300) }));
      })
    );
    setTokens("old-access", "stored-refresh");

    scheduleRefresh(makeToken(30));

    // One call arms the initial (immediate) refresh; a second call means the
    // new token was scheduled after the refresh completed.
    await waitFor(() =>
      expect(
        setTimeoutSpy.mock.calls.filter(([, delay]) => delay > 100_000).length
      ).toBe(1)
    );
  });

  it("redirects to portal login when the refresh fails", async () => {
    server.use(
      rest.post("http://api.test/api/token/refresh/", (req, res, ctx) => {
        return res(ctx.status(401));
      })
    );
    setTokens("old-access", "expired-refresh");

    scheduleRefresh(makeToken(30));

    await waitFor(() => expect(window.location.assign).toHaveBeenCalled());
    expect(window.location.assign.mock.calls[0][0]).toContain(
      `/accounts/login?next=${PATHNAME}`
    );
  });
});
