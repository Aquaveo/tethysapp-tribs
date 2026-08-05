import { rest } from "msw";

const handlers = [
  rest.get("http://api.test/api/apps/tribs/", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        title: "tRIBS Model Builder",
        description: "",
        tags: "",
        package: "tribs",
        urlNamespace: "tribs",
        color: "",
        icon: "/static/tribs/images/icon.png",
        exitUrl: "/apps/",
        rootUrl: "/apps/tribs/",
        settingsUrl: "/admin/tethys_apps/tethysapp/999/change/",
      }),
      ctx.set("Content-Type", "application/json")
    );
  }),
  rest.get("http://api.test/api/token/", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        access: "fake-access",
        refresh: "fake-refresh"
      }),
    );
  }),
  rest.get("http://api.test/api/whoami/", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        username: "jsmith",
        firstName: "John",
        lastName: "Smith",
        email: "jsmith@tethys.org",
        isAuthenticated: true,
        isStaff: true,
      }),
      ctx.set("Content-Type", "application/json")
    );
  }),
];

export { handlers };
