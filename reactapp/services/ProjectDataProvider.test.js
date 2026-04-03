import { render } from "@testing-library/react";

import { AppContext } from 'react-tethys/context';

import newUUID from "lib/uuid";
import ProjectDataProvider from "./ProjectDataProvider";
import { mockBackend, mockBackendAfterEach } from "config/tests/mocks/backend";


afterEach(() => {
  mockBackendAfterEach();
});

it("Calls children as render prop with project data after receiving it from server", async () => {
  const { server, backend } = await mockBackend();
  const cb = jest.fn();
  const appContext = {
      backend
  };

  render(
    <AppContext.Provider value={appContext}>
      <ProjectDataProvider>
        {cb}
      </ProjectDataProvider>
    </AppContext.Provider>
  );

  await expect(server).toReceiveMessage(
    expect.stringContaining("\"type\":\"PROJECT_DATA\"},\"payload\":{\"initial\":true}}")
  );

  const mockProject = {foo: "bar"};
  const actionId = newUUID();
  server.send(
    JSON.stringify({
      action: {
        id: actionId,
        type: backend.actions.PROJECT_DATA,
      },
      payload: mockProject,
    })
  );

  expect(cb).toHaveBeenCalledWith(mockProject, expect.any(Function));
});