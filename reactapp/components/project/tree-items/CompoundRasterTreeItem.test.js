import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";

import CompoundRasterTreeItem from "./CompoundRasterTreeItem";
import { makeRaster } from "config/tests/mocks/rasterMock";
import { GraphicsWindowVisualsContext, ProjectContext, SidePanelContext } from "react-tethys/context";
import newUUID from "lib/uuid";

function initAndRender() {
  const user = userEvent.setup();
  const raster = makeRaster("Some Compound Raster");
  // Layer format: <dataset-id>_<layer-variable> (no workspace prefix)
  raster.viz.layer = [`${raster.id}_1`, `${raster.id}_2`];
  const projectId = newUUID();
  const visibleObjects = {[projectId]: []};
  const openFolders = {[projectId]: []};
  const deleteCallback = jest.fn();
  const duplicateCallback = jest.fn();
  const updateCallback = jest.fn();
  const hideObject = jest.fn();
  const revealObject = jest.fn();
  const setFramedObject = jest.fn();
  const setZoomToExtent = jest.fn();
  const setProjectId = jest.fn();
  const closeFolder = jest.fn();
  const openFolder = jest.fn();
  const showPanel = jest.fn();
  const hideSidePanel = jest.fn();
  const visibleSidePanel = [];
  const CompoundRasterRender = (
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
          setFramedObject,
          setZoomToExtent,
        }}
      >
        <SidePanelContext.Provider
          value={{
            showPanel,
            hideSidePanel,
            visibleSidePanel,
          }}
        >
          <CompoundRasterTreeItem
            raster={raster}
            datasetIndex={0}
            onDelete={deleteCallback}
            onDuplicate={duplicateCallback}
            onUpdate={updateCallback}
          />
        </SidePanelContext.Provider>
      </GraphicsWindowVisualsContext.Provider>
    </ProjectContext.Provider>
  );

  const { rerender } = render(CompoundRasterRender);

  return {
    user,
    rerender,
    raster,
    CompoundRasterRender,
    deleteCallback,
    updateCallback,
    duplicateCallback,
    hideObject,
    revealObject,
    setFramedObject,
    setZoomToExtent,
  };
}

it("Creates a tree item with frame, delete, and rename actions in options menu", async () => {
  const { user } = initAndRender();
  const optionsButton = screen.getByRole("button", { name: /Options for Some Compound Raster/ });
  expect(optionsButton).toBeInTheDocument();
  await user.click(optionsButton);
  const frameButton = await screen.findByRole("button", { name: /Frame/ });
  const deleteButton = await screen.findByRole("button", { name: /Delete/ });
  const renameButton = await screen.findByRole("button", { name: /Rename/ });
  expect(frameButton).toBeVisible();
  expect(deleteButton).toBeVisible();
  expect(renameButton).toBeVisible();
});

it("Creates a tree item with details and download actions in options menu", async () => {
  const { user } = initAndRender();
  const optionsButton = screen.getByRole("button", { name: /Options for Some Compound Raster/ });
  await user.click(optionsButton);
  const detailsButton = await screen.findByRole("button", { name: /Details/ });
  const downloadButton = await screen.findByRole("button", { name: /Download/ });
  expect(detailsButton).toBeVisible();
  expect(downloadButton).toBeVisible();
});

it("Creates layer tree items with download actions in their options menus", async () => {
  const { user } = initAndRender();
  // Layer titles are derived from the layer name: "topp:states_1" -> "1"
  const layerOptionsButton = screen.getByRole("button", { name: "Options for 1" });
  await user.click(layerOptionsButton);
  const downloadButton = await screen.findByRole("button", { name: /Download/ });
  expect(downloadButton).toBeVisible();
});
