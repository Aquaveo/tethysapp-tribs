import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";

import { mockBackend, mockBackendAfterEach } from "config/tests/mocks/backend";
import RealizationOutputTreeItem from "./RealizationOutputTreeItem";
import { AppContext, GraphicsWindowVisualsContext, ProjectContext, SidePanelContext } from "react-tethys/context";
import { DO_NOT_SET_LAYER, FRAME_OBJECT } from "constants/GraphicsWindowConstants";
import newUUID from "lib/uuid";

const vizDataset = {
  "id": "ef458c1c-e390-4196-a152-405683d9b0c9",
  "name": "Node Dynamic Output",
  "type": "dataset_resource",
  "locked": false,
  "status": null,
  "attributes": {},
  "created_by": "_staff_user",
  "date_created": "2024-07-10T20:48:18.317243",
  "description": "Node Dynamic Output for tEST.",
  "display_type_plural": "Datasets",
  "display_type_singular": "Dataset",
  "organizations": [
    {
      "id": "67984deb-e430-435c-ba0f-fae786a0440f",
      "name": "Hello World"
    }
  ],
  "public": false,
  "slug": "datasets",
  "viz": {
    "type": "czml",
    "url": [
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/Mi_mm.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/GWflx_m3-h.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/HFlux_W-m2.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/LngRadIn_W-m2.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/SoilT_oC.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/RootMoist_d-l.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/Nwt_mm.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/NetRad_W-m2.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/Wind_m-s.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/Intercept_mm.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/Srf_Hour_mm.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/EvpTtrs_mm-h.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/Qstrm_m3-s.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/Runon_mm.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/Nt_mm.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/Hlev_m.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/EvpSoil_mm-h.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/Trnsm_m2-h.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/CumIntercept_mm.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/AirT_oC.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/SkyCov_d-l.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/Srf_mm.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/EvpDryCan_mm-h.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/LngRadOutW-m2_.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/NetPrecip_mm-hr.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/EvpWetCan_mm-h.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/SoilMoist_d-l.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/Recharge_mm-hr.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/ShortAbsbVeg_W-m2.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/CanStorg_mm.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/Press_Pa.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/ActEvp_mm-h.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/Rain_mm-h.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/Lflux_W-m2.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/PotEvp_mm-h.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/ShortAbsbSoi_W-m2.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/RelHum_d-l.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/ShrtRadIn_W-m2.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/SurfT_oC.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/Nf_mm.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/QpOut_mm-h.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/ShrtRadIn_dir_W-m2.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/ShrtRadIn_dif_W-m2.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/DewT_oC.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/Gflux_W-m2.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/QpIn_mm-h.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/Mu_mm.czml"
    ],
    "origin": [
      -112.5841635588148,
      34.29805405819842
    ],
    "extent": [
      -124.914551,
      24.766785,
      -67.412109,
      49.15297
    ]
  },
  "dataset_type": "TRIBS_OUT_PIXEL",
  "srid": null
};

const nonVizDataset = {
  "id": "26bf8339-38fa-4940-bd5a-6d6a75c9c937",
  "name": "Time-Integrated Variable Output",
  "type": "dataset_resource",
  "locked": false,
  "status": null,
  "attributes": {},
  "created_by": "_staff_user",
  "date_created": "2024-07-10T20:48:18.256012",
  "description": "Time-Integrated Variable Output for tEST.",
  "display_type_plural": "Datasets",
  "display_type_singular": "Dataset",
  "organizations": [
    {
      "id": "67984deb-e430-435c-ba0f-fae786a0440f",
      "name": "Hello World"
    }
  ],
  "public": false,
  "slug": "datasets",
  "dataset_type": "TRIBS_OUT_TIME_INTEGRATED",
  "srid": null
};

afterEach(() => {
  mockBackendAfterEach();
});

const initAndRender = async (viz = false, disabled = false) => {
  const user = userEvent.setup();
  const { server, backend } = await mockBackend();
  const projectId = newUUID();
  const openFolders = {[projectId]: []};
  const visibleCZMLObject = {};
  const visibleSidePanel = [];
  const deleteCallback = jest.fn();
  const updateCallback = jest.fn();
  const hideObject = jest.fn();
  const revealObject = jest.fn();
  const setFramedObject = jest.fn();
  const setZoomToExtent = jest.fn();
  const showPanel = jest.fn();
  const setCZMLLayer = jest.fn();
  const setSelectedCZMLPoint = jest.fn();
  const hideSidePanel = jest.fn();
  const setProjectId = jest.fn();
  const closeFolder = jest.fn();
  const openFolder = jest.fn();

  const RealizationRender = (viz, disabled) => {
    const visibleObjects = {[projectId]: []};
    if (viz && !disabled) {
      visibleCZMLObject[vizDataset.id] =  "Mi_mm";
      if (!visibleObjects[projectId].includes(vizDataset.id)) {
        visibleObjects[projectId].push(vizDataset.id);
      }
    }

    if (viz && disabled) {
      visibleCZMLObject[vizDataset.id] = DO_NOT_SET_LAYER;
      if (visibleObjects[projectId].includes(vizDataset.id)) {
        visibleObjects[projectId] = {...visibleObjects[projectId].filter(id => id !== vizDataset.id)};
      }
    }
    return (
      <AppContext.Provider value={{ backend: backend, csrf: "12345" }}>
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
              visibleCZMLObject,
              setCZMLLayer,
              setSelectedCZMLPoint,
            }}
          >
            <SidePanelContext.Provider value={{ showPanel, hideSidePanel, visibleSidePanel }}>
              <RealizationOutputTreeItem
                dataset={viz ? vizDataset : nonVizDataset}
                onDelete={deleteCallback}
                onUpdate={updateCallback}
                realizationIndex={0}
              />
            </SidePanelContext.Provider>
          </GraphicsWindowVisualsContext.Provider>
        </ProjectContext.Provider>
      </AppContext.Provider>
    );
  };

  const { rerender } = render(RealizationRender(viz, disabled));

  return {
    user,
    rerender,
    RealizationRender,
    server,
    backend,
    deleteCallback,
    updateCallback,
    hideObject,
    revealObject,
    setCZMLLayer,
    setSelectedCZMLPoint,
    hideSidePanel,
    setFramedObject,
    setZoomToExtent,
    showPanel,
  };
}

it("Creates a tree item with an inline visibility action", async () => {
  await initAndRender(true);
  const visibilityButton = screen.getByRole("button", { name: /Visible/ });
  expect(visibilityButton).toBeInTheDocument();
});

it("Creates a tree item with frame, delete, properties, and rename actions in options menu", async () => {
  const { user } = await initAndRender(true);
  const optionsButton = screen.getByRole("button", { name: /Options/ });
  expect(optionsButton).toBeInTheDocument();
  await user.click(optionsButton);
  const frameButton = await screen.findByRole("button", { name: /Frame/ });
  const deleteButton = await screen.findByRole("button", { name: /Delete/ });
  const renameButton = await screen.findByRole("button", { name: /Rename/ });
  const propertiesButton = await screen.findByRole("button", { name: /Visible: Mi_mm/ });
  expect(frameButton).toBeVisible();
  expect(deleteButton).toBeVisible();
  expect(renameButton).toBeVisible();
  expect(propertiesButton).toBeVisible();
});

it("Calls graphics toggle visibility callback and setCZMLLayer callback when visibilty button pressed", async () => {
  const { user, hideObject, revealObject, setCZMLLayer } = await initAndRender(true);
  const visibilityButton = screen.getByRole("button", { name: /Visible/ });

  await user.click(visibilityButton);
  expect(hideObject).toHaveBeenCalledWith(vizDataset.id);
  expect(setCZMLLayer).toHaveBeenCalledWith(vizDataset.id, DO_NOT_SET_LAYER);

  await user.click(visibilityButton);
  expect(revealObject).toHaveBeenCalledWith(vizDataset.id);

  const firstCZMLLayer = vizDataset.viz.url[0]
  const visibileLayerDatasetName = firstCZMLLayer.split("/").slice(-1)[0];
  const layerName = visibileLayerDatasetName.split(".").slice(0)[0];
  expect(setCZMLLayer).toHaveBeenCalledWith(vizDataset.id, layerName);
});

it("Calls graphics delete and delete callback when delete button pressed", async () => {
  const { user, deleteCallback, rerender, RealizationRender } = await initAndRender();
  const optionsButton = screen.getByRole("button", { name: /Options/ });
  await user.click(optionsButton);
  const deleteButton = await screen.findByRole("button", { name: /Delete/ });
  await user.click(deleteButton);

  await rerender(RealizationRender());
  const confirmDelete = screen.getByRole("button", { name: "Yes" })
  await user.click(confirmDelete);

  expect(deleteCallback).toHaveBeenCalled();
});

it("Opens and then closes the Confirm Delete modal", async () => {
  const { user, rerender, RealizationRender } = await initAndRender();
  const optionsButton = screen.getByRole("button", { name: /Options/ });
  await user.click(optionsButton);
  const deleteButton = await screen.findByRole("button", { name: /Delete/ });
  await user.click(deleteButton);

  await rerender(RealizationRender());
  const deleteModal = screen.getByText("Confirm Delete");
  expect(deleteModal).toBeInTheDocument();
  const confirmDelete = screen.getByRole("button", { name: "Yes" });
  expect(confirmDelete).toBeInTheDocument();
  const cancelDelete = screen.getByRole("button", { name: "No" });
  expect(cancelDelete).toBeInTheDocument();
  await user.click(cancelDelete);

  await rerender(RealizationRender());
  expect(deleteModal).not.toBeInTheDocument();
});

it("Calls graphics frame callback when frame button pressed", async () => {
  const { user, setFramedObject, setZoomToExtent } = await initAndRender(true);
  const optionsButton = screen.getByRole("button", { name: /Options/ });
  await user.click(optionsButton);
  const frameButton = await screen.findByRole("button", { name: /Frame/ });
  await user.click(frameButton);
  expect(setFramedObject).toHaveBeenCalledWith(vizDataset.viz.extent, FRAME_OBJECT);
  expect(setZoomToExtent).toHaveBeenCalledWith(FRAME_OBJECT);
});

it("Calls update callback when rename save button pressed", async () => {
  const { user, updateCallback } = await initAndRender();
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

it("Calls the open side panel callback when Properties button is pressed", async () => {
  const {
    user,
    setCZMLLayer,
    showPanel,
    revealObject,
    rerender,
    RealizationRender
  } = await initAndRender(true, true);
  const visibilityButton = screen.getByRole("button", { name: /Hidden/ });
  await user.click(visibilityButton);
  expect(revealObject).toHaveBeenCalledWith(vizDataset.id);

  const firstCZMLLayer = vizDataset.viz.url[0]
  const visibileLayerDatasetName = firstCZMLLayer.split("/").slice(-1)[0];
  const layerName = visibileLayerDatasetName.split(".").slice(0)[0];
  expect(setCZMLLayer).toHaveBeenCalledWith(vizDataset.id, layerName);

  await rerender(RealizationRender(true));

  const newVisibilityButton = screen.getByRole("button", { name: /Visible/ });
  expect(newVisibilityButton).toBeInTheDocument();

  const optionsButton = screen.getByRole("button", { name: /Options/ });
  await user.click(optionsButton);
  const propertiesButton = await screen.findByRole("button", { name: /Visible: Mi_mm/ });
  await user.click(propertiesButton);

  expect(showPanel).toHaveBeenCalledWith(`slide-panel-${vizDataset.id}`);
});

it("Will not call the open side panel callback when the dataset is disabled", async () => {
  const { user, showPanel } = await initAndRender(true, true);
  const optionsButton = screen.getByRole("button", { name: /Options/ });
  await user.click(optionsButton);

  const propertiesButton = await screen.findByRole("button", { name: `Visible: ${DO_NOT_SET_LAYER}` });
  await user.click(propertiesButton);

  expect(showPanel).not.toHaveBeenCalled();
});
