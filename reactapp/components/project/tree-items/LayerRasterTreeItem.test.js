import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";

import LayerRasterTreeItem from "./LayerRasterTreeItem";
import { makeRaster } from "config/tests/mocks/rasterMock";
import { GraphicsWindowVisualsContext, ProjectContext, SidePanelContext } from "react-tethys/context";
import { FRAME_OBJECT } from "constants/GraphicsWindowConstants";
import newUUID from "lib/uuid";

function initAndRender() {
  const user = userEvent.setup();
  const raster = makeRaster("Some Compound Raster");
  // Layer format: <dataset-id>_<layer-variable> (no workspace prefix)
  const layer = `${raster.id}_0-5cm`;
  raster.viz.layer = [layer];
  const projectId = newUUID();
  const visibleObjects = {[projectId]: []};
  const openFolders = {[projectId]: []};
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
  const LayerRender = (
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
          <LayerRasterTreeItem
            layer={layer}
            datasetIndex={0}
            extent={raster.viz.extent}
            raster={raster}
          />
        </SidePanelContext.Provider>
      </GraphicsWindowVisualsContext.Provider>
    </ProjectContext.Provider>
  );

  const { rerender } = render(LayerRender);

  return {
    user,
    rerender,
    raster,
    layer,
    LayerRender,
    hideObject,
    revealObject,
    setFramedObject,
    setZoomToExtent,
  };
}

it("Creates a tree item with an inline visibility action", () => {
  initAndRender();
  const visibilityButton = screen.getAllByRole("button", { name: /Hidden/ })[0];
  expect(visibilityButton).toBeInTheDocument();
});

it("Creates a tree item with frame and download actions in options menu", async () => {
  const { user } = initAndRender();
  const optionsButton = screen.getByRole("button", { name: /Options/ });
  await user.click(optionsButton);
  const frameButton = await screen.findByRole("button", { name: /Frame/ });
  const downloadButton = await screen.findByRole("button", { name: /Download/ });
  expect(frameButton).toBeVisible();
  expect(downloadButton).toBeVisible();
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

it("Navigates to the download_layer endpoint when download button pressed", async () => {
  const originalLocation = window.location;
  delete window.location;
  window.location = { href: "" };

  const { user, raster, layer } = initAndRender();
  const optionsButton = screen.getByRole("button", { name: /Options/ });
  await user.click(optionsButton);
  const downloadButton = await screen.findByRole("button", { name: /Download/ });
  await user.click(downloadButton);
  expect(window.location.href).toBe(
    `/apps/tribs/datasets/${raster.id}/details/files/?tab_action=download_layer&layer=${encodeURIComponent(layer)}`
  );

  window.location = originalLocation;
});
