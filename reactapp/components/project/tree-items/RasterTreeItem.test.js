import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";

import RasterTreeItem from "./RasterTreeItem";
import { makeRaster } from "config/tests/mocks/rasterMock";
import { GraphicsWindowVisualsContext, ProjectContext } from "react-tethys/context";
import { FRAME_OBJECT } from "constants/GraphicsWindowConstants";
import newUUID from "lib/uuid";

function initAndRender() {
  const user = userEvent.setup();
  const raster = makeRaster("Some Raster");
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
  const RasterRender = (
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
        <RasterTreeItem
          raster={raster}
          datasetIndex={0}
          onDelete={deleteCallback}
          onDuplicate={duplicateCallback}
          onUpdate={updateCallback}
        />
      </GraphicsWindowVisualsContext.Provider>
    </ProjectContext.Provider>
  );

  const { rerender } = render(RasterRender);

  return {
    user,
    rerender,
    raster,
    RasterRender,
    deleteCallback,
    updateCallback,
    duplicateCallback,
    hideObject,
    revealObject,
    setFramedObject,
    setZoomToExtent,
  };
}

it("Creates a tree item with an inline visibility action", () => {
  initAndRender();
  const visibilityButton = screen.getByRole("button", { name: /Hidden/ });
  expect(visibilityButton).toBeInTheDocument();
});

it("Creates a tree item with frame, delete, and rename actions in options menu", async () => {
  const { user } = initAndRender();
  const optionsButton = screen.getByRole("button", { name: /Options/ });
  expect(optionsButton).toBeInTheDocument();
  await user.click(optionsButton);
  const frameButton = await screen.findByRole("button", { name: /Frame/ });
  const deleteButton = await screen.findByRole("button", { name: /Delete/ });
  const renameButton = await screen.findByRole("button", { name: /Rename/ });
  expect(frameButton).toBeVisible();
  expect(deleteButton).toBeVisible();
  expect(renameButton).toBeVisible();
});

it("Calls graphics toggle visibility callback when visibilty button pressed", async () => {
  const { user, raster, hideObject, revealObject } = initAndRender();
  const visibilityButton = screen.getByRole("button", { name: /Hidden/ });
  await user.click(visibilityButton);
  expect(revealObject).toHaveBeenCalledWith(raster.id);
  
  await user.click(visibilityButton);
  expect(hideObject).toHaveBeenCalledWith(raster.id);
});

it("Calls graphics delete and delete callback when delete button pressed", async () => {
  const { user, deleteCallback, rerender, RasterRender } = initAndRender();
  const optionsButton = screen.getByRole("button", { name: /Options/ });
  await user.click(optionsButton);
  const deleteButton = await screen.findByRole("button", { name: /Delete/ });
  await user.click(deleteButton);

  await rerender(RasterRender);
  const confirmDelete = screen.getByRole("button", { name: "Yes" })
  await user.click(confirmDelete);

  expect(deleteCallback).toHaveBeenCalled();
});

it("Opens and then closes the Confirm Delete modal", async () => {
  const { user, rerender, RasterRender } = initAndRender();
  const optionsButton = screen.getByRole("button", { name: /Options/ });
  await user.click(optionsButton);
  const deleteButton = await screen.findByRole("button", { name: /Delete/ });
  await user.click(deleteButton);

  await rerender(RasterRender);
  const deleteModal = screen.getByText("Confirm Delete");
  expect(deleteModal).toBeInTheDocument();
  const confirmDelete = screen.getByRole("button", { name: "Yes" });
  expect(confirmDelete).toBeInTheDocument();
  const cancelDelete = screen.getByRole("button", { name: "No" });
  expect(cancelDelete).toBeInTheDocument();
  await user.click(cancelDelete);

  await rerender(RasterRender);
  expect(deleteModal).not.toBeInTheDocument();
});

it("Calls graphics frame callback when frame button pressed", async () => {
  const { user, raster, setFramedObject, setZoomToExtent } = initAndRender();
  const optionsButton = screen.getByRole("button", { name: /Options/ });
  await user.click(optionsButton);
  const frameButton = await screen.findByRole("button", { name: /Frame/ });
  await user.click(frameButton);
  expect(setFramedObject).toHaveBeenCalledWith(raster.viz.extent, FRAME_OBJECT);
  expect(setZoomToExtent).toHaveBeenCalledWith(FRAME_OBJECT);
});

it("Calls update callback when rename save button pressed", async () => {
  const { user, updateCallback } = initAndRender();
  const optionsButton = screen.getByRole("button", { name: /Options/ });
  await user.click(optionsButton);
  const renameButton = await screen.findByRole("button", { name: /Rename/ });
  await user.click(renameButton);
  const renameTextbox = await screen.findByRole("textbox");
  const renameSave = await screen.findByRole("button", { name: /^Save$/ });
  await user.clear(renameTextbox);
  await user.type(renameTextbox, "New Name");
  await user.click(renameSave);
  expect(updateCallback).toHaveBeenCalled();
  const callArg = updateCallback.mock.calls[0][0];
  expect(callArg.name).toBe("New Name");
});

it("Calls duplicate callback when duplicate button pressed", async () => {
  const { user, duplicateCallback } = initAndRender();
  const optionsButton = screen.getByRole("button", { name: /Options/ });
  await user.click(optionsButton);
  const duplicateButton = await screen.findByRole("button", { name: /Duplicate/ });
  await user.click(duplicateButton);
  expect(duplicateCallback).toHaveBeenCalled();
});
