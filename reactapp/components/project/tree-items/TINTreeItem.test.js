import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";

import TINTreeItem from "./TINTreeItem";
import { makeGIS } from "config/tests/mocks/gisMock";
import { GraphicsWindowVisualsContext, ProjectContext } from "react-tethys/context";
import newUUID from "lib/uuid";

function initAndRender() {
  const user = userEvent.setup();
  const dataset = makeGIS("Soil Moisture.txt");
  const projectId = newUUID();
  const visibleObjects = {[projectId]: []};
  const openFolders = {[projectId]: []};
  const hideObject = jest.fn();
  const revealObject = jest.fn();
  const setProjectId = jest.fn();
  const closeFolder = jest.fn();
  const openFolder = jest.fn();

  render(
    <ProjectContext.Provider
      value={{
        projectId,
        setProjectId,
        openFolders,
        closeFolder,
        openFolder,
      }}
    >
      <GraphicsWindowVisualsContext.Provider
        value={{
          visibleObjects,
          hideObject,
          revealObject,
        }}
      >
        <TINTreeItem
          dataset={dataset}
          datasetIndex={0}
        />
      </GraphicsWindowVisualsContext.Provider>
    </ProjectContext.Provider>
  );

  return {
    user,
    dataset,
    hideObject,
    revealObject,
  };
}

it("Creates a tree item element with the given title", () => {
  initAndRender();
  const treeItem = screen.getByAltText("SOIL_MOISTURE");
  expect(treeItem).toBeInTheDocument();
});

it("Creates a tree item with an inline visibility action", () => {
  initAndRender();
  const visibilityButton = screen.getByRole("button", { name: /Hidden/ });
  expect(visibilityButton).toBeInTheDocument();
});

it("Calls graphics toggle visibility callback when visibilty button pressed", async () => {
  const { user, dataset, hideObject, revealObject } = initAndRender();
  const visibilityButton = screen.getByRole("button", { name: /Hidden/ });
  await user.click(visibilityButton);
  expect(revealObject).toHaveBeenCalledWith(dataset.id);

  await user.click(visibilityButton);
  expect(hideObject).toHaveBeenCalledWith(dataset.id);
});
