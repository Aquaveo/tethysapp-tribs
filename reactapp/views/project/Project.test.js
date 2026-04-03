import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "react-toastify";

import {
  AppContext,
  ProjectObjectContext,
  ModalContext,
  GraphicsWindowVisualsContext,
  ProjectContext
} from 'react-tethys/context';

import { mockBackend, mockBackendAfterEach } from "config/tests/mocks/backend";
import Project from "./Project";
import { serialized_project } from "config/tests/mocks/projectContext";
import { FRAME_OBJECT, HOME } from "constants/GraphicsWindowConstants";
import newUUID from "lib/uuid";

afterEach(() => {
  mockBackendAfterEach();
});

jest.mock("components/graphics-window/GraphicsWindow");
jest.setTimeout(60000);

const pauseFor = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const setupProject = async () => {
  const user = userEvent.setup()
  const { server, backend } = await mockBackend();
  const setProject = jest.fn();

  const setProjectId = jest.fn();
  const closeFolder = jest.fn();
  const openFolder = jest.fn();
  const setIsFirstProjectRender = jest.fn();

  const setShowAddMesh = jest.fn();
  const setShowAddGIS = jest.fn();
  const setShowAddRaster = jest.fn();
  const setShowAddTabular = jest.fn();
  const setShowAddGenericDataset = jest.fn();
  const setShowAddScenario = jest.fn();
  const setShowModelControl = jest.fn();
  const setShowRealizationModelControl = jest.fn();
  const setWorkflowsModal = jest.fn();

  const setDataObject = jest.fn();
  const setProjectObjectLocation = jest.fn();

  const setFramedObject = jest.fn();
  const hideObject = jest.fn();
  const revealObject = jest.fn();
  const setZoomToExtent = jest.fn();
  const setStartDates = jest.fn();

  const projectContextValue = {
    setProjectId,
    closeFolder,
    openFolder,
    setIsFirstProjectRender,
  }

  const modalContextValue = {
    setShowAddMesh,
    setShowAddGIS,
    setShowAddRaster,
    setShowAddTabular,
    setShowAddGenericDataset,
    setShowAddScenario,
    setShowModelControl,
    setShowRealizationModelControl,
    setWorkflowsModal,
  };

  const projectObjectContextValue = {
    setDataObject,
    setProjectObjectLocation,
  }

  const visualsContextValue = {
    setFramedObject,
    hideObject,
    revealObject,
    setZoomToExtent,
    setStartDates,
  }

  const Cesium_API_Key = "Mocked_Cesium_API_Key"
  const appContextValue = {
    backend,
    tethysApp: {
      customSettings: {
        Cesium_API_Key: {
          value: Cesium_API_Key
        }
      }
    }
  };

  const projectId = newUUID();

  const defaultProps = {
    // These properties are to help with rerendering if that's necessary

    // Project Context
    projectId: projectId,
    isFirstProjectRender: false,
    openFolders: {[projectId]: []},

    // Project Object Context
    dataObject: "",
    projectObjectLocation: "",

    // Modal context
    showAddMesh: false,
    showAddGIS: false,
    showAddRaster: false,
    showAddTabular: false,
    showAddGenericDataset: false,
    showAddScenario: false,
    modelControl: false,
    realizationModelControl: false,
    workflowsModal: false,

    // Visual Context
    framedObject: {[HOME]: null, [FRAME_OBJECT]: null},
    visibleObjects: {[projectId]: []},
    startDates: [],
  };

  const projectRender = (props = {}) => {
    // The point of having this desctructuring step is to rerender with different properties.
    // For example, rendering a screen without a modal, rerendering to show the modal, and then rererendering to close the modal
    const {
      dataObject,
      projectObjectLocation,
      showAddMesh,
      showAddGIS,
      showAddRaster,
      showAddTabular,
      showAddGenericDataset,
      showAddScenario,
      modelControl,
      realizationModelControl,
      workflowsModal,
      framedObject,
      visibleObjects,
      setZoomToExtent,
      startDates,
      setStartDates,
      openFolders,
      isFirstProjectRender,
    } = { ...defaultProps, ...props };

    const rerenderableProjectContext = {
      projectId,
      openFolders,
      isFirstProjectRender,
      ...projectContextValue
    }

    const rerenderableProjectObjectContext = {
      dataObject,
      projectObjectLocation,
      ...projectObjectContextValue,
    };
    const rerenderableModalContext = {
      showAddMesh,
      showAddGIS,
      showAddRaster,
      showAddTabular,
      showAddGenericDataset,
      showAddScenario,
      modelControl,
      realizationModelControl,
      workflowsModal,
      ...modalContextValue,
    };
    const rerenderableVisualsContext = {
      framedObject,
      visibleObjects,
      setZoomToExtent,
      startDates,
      setStartDates,
      ...visualsContextValue,
    }

    return (
      <AppContext.Provider value={appContextValue}>
        <ProjectContext.Provider value={rerenderableProjectContext}>
          <ProjectObjectContext.Provider value={rerenderableProjectObjectContext}>
            <ModalContext.Provider value={rerenderableModalContext}>
              <GraphicsWindowVisualsContext.Provider value={rerenderableVisualsContext}>
                <Project project={serialized_project} setProject={setProject} />
              </GraphicsWindowVisualsContext.Provider>
            </ModalContext.Provider>
          </ProjectObjectContext.Provider>
        </ProjectContext.Provider>
      </AppContext.Provider>
    );
  }

  const { rerender } = render(projectRender());

  return {
    user,
    server,
    backend,
    projectId,
    projectRender,
    rerender,
    setShowAddMesh,
    setShowAddGIS,
    setShowAddRaster,
    setShowAddTabular,
    setShowAddGenericDataset,
    setShowAddScenario,
    setShowModelControl,
    setWorkflowsModal,
    setShowRealizationModelControl,
    setDataObject,
    setProjectObjectLocation,
    setFramedObject,
    hideObject,
    revealObject,
    setStartDates,
  }
}

describe("Project", () => {
  it("Should have all of the root folders", async () => {
    await setupProject();
    expect(screen.getByText(serialized_project.name)).toBeInTheDocument();
    expect(screen.getByText("Mesh Data")).toBeInTheDocument();
    expect(screen.getByText("GIS Data")).toBeInTheDocument();
    expect(screen.getByText("Raster Data")).toBeInTheDocument();
    expect(screen.getByText("Tabular Data")).toBeInTheDocument();
    expect(screen.getByText("Scenario Data")).toBeInTheDocument();
    expect(screen.getByText("Realization Data")).toBeInTheDocument();
  });

  describe("Open Modals", () => {
    it("Should open and close the Add Mesh modal", async () => {
      const { user, rerender, projectRender, setShowAddMesh } = await setupProject();
      const addMeshButton = screen.getByRole("button", { name: "Add Mesh" });
      await user.click(addMeshButton);
      expect(setShowAddMesh).toHaveBeenCalled();

      rerender(projectRender({showAddMesh: true}));
      expect(screen.getByText("Select Mesh Type")).toBeInTheDocument();
      const cancelButton = screen.getByRole("button", { name: "Cancel"});
      await user.click(cancelButton);
      expect(setShowAddMesh).toHaveBeenCalled();

      rerender(projectRender({showAddMesh: false}));
      await waitFor(() => {
        expect(cancelButton).not.toBeInTheDocument();
      })
    });

    it("Should open and close the Add GIS modal", async () => {
      const { user, rerender, projectRender, setShowAddGIS } = await setupProject();
      const addGISButton = screen.getByRole("button", { name: "Add GIS" });
      await user.click(addGISButton);
      expect(setShowAddGIS).toHaveBeenCalled();

      rerender(projectRender({showAddGIS: true}));
      expect(screen.getByText("Select GIS Type")).toBeInTheDocument();
      const cancelButton = screen.getByRole("button", { name: "Cancel"});
      await user.click(cancelButton);
      expect(setShowAddGIS).toHaveBeenCalled();

      rerender(projectRender({showAddGIS: false}));
      await waitFor(() => {
        expect(cancelButton).not.toBeInTheDocument();
      })
    });

    it("Should open and close the Add Raster modal", async () => {
      const { user, rerender, projectRender, setShowAddRaster } = await setupProject();
      const addRasterButton = screen.getByRole("button", { name: "Add Raster" });
      await user.click(addRasterButton);
      expect(setShowAddRaster).toHaveBeenCalled();

      rerender(projectRender({showAddRaster: true}));
      expect(screen.getByText("Select Raster Type")).toBeInTheDocument();
      const cancelButton = screen.getByRole("button", { name: "Cancel"});
      await user.click(cancelButton);
      expect(setShowAddRaster).toHaveBeenCalled();

      rerender(projectRender({showAddRaster: false}));
      await waitFor(() => {
        expect(cancelButton).not.toBeInTheDocument();
      })
    });

    it("Should open and close the Add Tabular modal", async () => {
      const { user, rerender, projectRender, setShowAddTabular } = await setupProject();
      const addTabularButton = screen.getByRole("button", { name: "Add Tabular" });
      await user.click(addTabularButton);
      expect(setShowAddTabular).toHaveBeenCalled();

      rerender(projectRender({showAddTabular: true}));
      expect(screen.getByText("Select Tabular Dataset Type")).toBeInTheDocument();
      const cancelButton = screen.getByRole("button", { name: "Cancel"});
      await user.click(cancelButton);
      expect(setShowAddTabular).toHaveBeenCalled();

      rerender(projectRender({showAddTabular: false}));
      await waitFor(() => {
        expect(cancelButton).not.toBeInTheDocument();
      })
    });

    it("Should open and close the Add Scenario modal", async () => {
      const { user, rerender, projectRender, setShowAddScenario } = await setupProject();
      const addScenarioButton = screen.getByRole("button", { name: "Add Scenario" });
      await user.click(addScenarioButton);
      expect(setShowAddScenario).toHaveBeenCalled();

      rerender(projectRender({showAddScenario: true}));
      expect(screen.getByRole("heading", { name: "Add Scenario"})).toBeInTheDocument();
      const cancelButton = screen.getByRole("button", { name: "Cancel"});
      await user.click(cancelButton);
      expect(setShowAddScenario).toHaveBeenCalled();

      rerender(projectRender({showAddScenario: false}));
      await waitFor(() => {
        expect(cancelButton).not.toBeInTheDocument();
      })
    });

    it("Should open and close the Scenarios Model Control", async () => {
      const { user, rerender, projectRender, setShowModelControl } = await setupProject();
      const modelControlButton = screen.getAllByRole("button", { name: "Settings" })[0]; // TODO Change the name of this button
      await user.click(modelControlButton);
      expect(setShowModelControl).toHaveBeenCalled();

      rerender(projectRender({modelControl: true}));
      expect(screen.getByRole("heading", { name: "Model Control"})).toBeInTheDocument();
      const closeButton = screen.getByRole("button", { name: "Close"});
      await user.click(closeButton);
      expect(setShowModelControl).toHaveBeenCalled();

      rerender(projectRender({modelControl: false}));
      await waitFor(() => {
        expect(closeButton).not.toBeInTheDocument();
      })
    });

    it("Should open and close the Realizations Model Control", async () => {
      const { user, rerender, projectRender, setShowRealizationModelControl } = await setupProject();
      const modelControlButton = screen.getAllByRole("button", { name: "Settings" })[1]; // TODO Change the name of this button
      await user.click(modelControlButton);
      expect(setShowRealizationModelControl).toHaveBeenCalled();

      rerender(projectRender({modelControl: true}));
      expect(screen.getByRole("heading", { name: "Model Control"})).toBeInTheDocument();
      const closeButton = screen.getByRole("button", { name: "Close"});
      await user.click(closeButton);
      expect(setShowRealizationModelControl).toHaveBeenCalled();

      rerender(projectRender({modelControl: false}));
      await waitFor(() => {
        expect(closeButton).not.toBeInTheDocument();
      })
    });

    it("Should open and close the Workflows Modal", async () => {
      const { user, rerender, projectRender, setWorkflowsModal } = await setupProject();
      const workflowsModalButton = screen.getByRole("button", { name: "Open Workflows" });
      await user.click(workflowsModalButton);
      expect(setWorkflowsModal).toHaveBeenCalled();

      rerender(projectRender({workflowsModal: true}));
      expect(screen.getByRole("heading", { name: "Workflows"})).toBeInTheDocument();
      const closeButton = screen.getByRole("button", { name: "Close"});
      await user.click(closeButton);
      expect(setWorkflowsModal).toHaveBeenCalled();

      rerender(projectRender({workflowsModal: false}));
      await waitFor(() => {
        expect(closeButton).not.toBeInTheDocument();
      })
    });
  });

  describe("Add Dataset Modal", () => {
    it("Should open the Add Mesh modal and add a dataset", async () => {
      const {
        user,
        rerender,
        projectRender,
        setShowAddMesh,
        server,
        backend,
        projectId,
      } = await setupProject();
      const addMeshButton = screen.getByRole("button", { name: "Add Mesh" });
      await user.click(addMeshButton);
      expect(setShowAddMesh).toHaveBeenCalled();

      rerender(projectRender({showAddMesh: true}));
      expect(screen.getByText("Select Mesh Type")).toBeInTheDocument();


      const someValues = [{ name: 'teresa teng' }];
      const str = JSON.stringify(someValues);
      const file = new File(["(⌐□_□)"], "chucknorris.png", { type: "image/png" });
      File.prototype.text = jest.fn().mockResolvedValueOnce(str);

      const fileInput = screen.getByLabelText(/File/);
      const nameInput = screen.getByLabelText(/Name/);
      const datasetTypeInput = screen.getByRole("combobox", { name: "Select Mesh Type"});
      const submitButton = screen.getByTestId("add-mesh-add-button");

      await user.upload(fileInput, file);
      expect(fileInput.files[0]).toBe(file);
      expect(fileInput.files).toHaveLength(1);
      expect(fileInput).toHaveValue("C:\\fakepath\\chucknorris.png");
      expect(nameInput).toHaveValue("chucknorris.png");

      await user.clear(nameInput);
      await user.type(nameInput, "Chuck Norris");
      expect(nameInput).toHaveValue("Chuck Norris");

      await user.selectOptions(datasetTypeInput, "TRIBS_TIN");
      expect(datasetTypeInput).toHaveValue("TRIBS_TIN");

      await user.click(submitButton);

      const invisibleFileError = screen.queryByText("Please select a valid geometry file (.stl, .gdf)");
      const invisibleNameError = screen.queryByText("Please provide a name for the Raster.");
      const invisibleDatasetTypeError = screen.queryByText("Please provide a type for the Raster.");

      // Validate initial state - expect not to be invalid
      expect(invisibleFileError).not.toBeInTheDocument();
      expect(invisibleNameError).not.toBeInTheDocument();
      expect(invisibleDatasetTypeError).not.toBeInTheDocument();

      await expect(server).toReceiveMessage(
        expect.stringContaining('"type":"UPLOAD_FILE"}')
      );

      const forActionId = newUUID();
      server.send(
        JSON.stringify({
          action: {
            id: newUUID(),
            type: backend.actions.UPLOAD_FILE_PROGRESS,
          },
          payload: {
            'forActionId': forActionId,
            'currFile': 1,
            'numFiles': 1,
            'currChunk': 1,
            'numChunks': 1,
            'currFileName': "chucknorris.png",
          },
        })
      );

      rerender(projectRender({showAddMesh: false}));
      await waitFor(() => {
        expect(screen.queryByText("Select Mesh Type")).not.toBeInTheDocument();
      });

      expect(toast.success).toHaveBeenCalledWith("File Upload successful for chucknorris.png", {
        position: "top-right",
        hideProgressBar: false,
        autoClose: 3000,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        toastId: forActionId,
        progress: undefined,
      });

      const meshTreeIcons = screen.getAllByAltText("Mesh Data");
      expect(meshTreeIcons).toHaveLength(1);

      const dataset = {
        id: newUUID(),
        name: "Chuck Norris",
        type: "dataset_resource",
        locked: false,
        status: "Complete",
        attributes: {
          fromAction: newUUID()
        },
        created_by: "_staff_user",
        date_created: new Date(),
        description: "",
        display_type_plural: "Datasets",
        display_type_singular: "Dataset",
        organizations: [
          {
            id: newUUID(),
            name: "Test"
          }
        ],
        public: false,
        slug: "datasets",
        viz: {
          type: "wms",
          url: "http://localhost:8181/geoserver/wms/",
          layer: `tribs:${projectId}`,
          extent: [ // Do we want to mock the extents here?
            -111.65440426486374,
            34.57955911078993,
            -111.58361694982506,
            34.636153749951596
          ],
          origin: null
        },
        dataset_type: "TRIBS_TIN",
        srid: "32612"
      };

      server.send(JSON.stringify({
        action: {
          id: newUUID(),
          type: backend.actions.DATASET_DATA
        },
        payload: dataset,
      }));

      rerender(projectRender());
      await pauseFor(500);
      const newDatasetTreeItem = screen.getByText(/Chuck Norris/);
      const newMeshTreeIcons = screen.getAllByAltText("Mesh Data");
      expect(newDatasetTreeItem).toBeInTheDocument();
      expect(newMeshTreeIcons).toHaveLength(2);
    });

    it("Should open the Add GIS modal and add a dataset", async () => {
      const {
        user,
        rerender,
        projectRender,
        setShowAddGIS,
        server,
        backend,
        projectId,
      } = await setupProject();
      const addGISButton = screen.getByRole("button", { name: "Add GIS" });
      await user.click(addGISButton);
      expect(setShowAddGIS).toHaveBeenCalled();

      rerender(projectRender({showAddGIS: true}));
      expect(screen.getByText("Select GIS Type")).toBeInTheDocument();


      const someValues = [{ name: 'teresa teng' }];
      const str = JSON.stringify(someValues);
      const file = new File(["(⌐□_□)"], "chucknorris.png", { type: "image/png" });
      File.prototype.text = jest.fn().mockResolvedValueOnce(str);

      const fileInput = screen.getByLabelText(/File/);
      const nameInput = screen.getByLabelText(/Name/);
      const datasetTypeInput = screen.getByRole("combobox", { name: "Select GIS Type"});
      const submitButton = screen.getByTestId("add-gis-add-button");

      await user.upload(fileInput, file);
      expect(fileInput.files[0]).toBe(file);
      expect(fileInput.files).toHaveLength(1);
      expect(fileInput).toHaveValue("C:\\fakepath\\chucknorris.png");
      expect(nameInput).toHaveValue("chucknorris.png");

      await user.clear(nameInput);
      await user.type(nameInput, "Chuck Norris");
      expect(nameInput).toHaveValue("Chuck Norris");

      await user.selectOptions(datasetTypeInput, "FEATURES_SHAPEFILE");
      expect(datasetTypeInput).toHaveValue("FEATURES_SHAPEFILE");

      await user.click(submitButton);

      const invisibleFileError = screen.queryByText("Please select a valid geometry file (.stl, .gdf)");
      const invisibleNameError = screen.queryByText("Please provide a name for the GIS Dataset.");
      const invisibleDatasetTypeError = screen.queryByText("Please provide a type for the GIS Dataset.");

      // Validate initial state - expect not to be invalid
      expect(invisibleFileError).not.toBeInTheDocument();
      expect(invisibleNameError).not.toBeInTheDocument();
      expect(invisibleDatasetTypeError).not.toBeInTheDocument();

      await expect(server).toReceiveMessage(
        expect.stringContaining('"type":"UPLOAD_FILE"}')
      );

      const forActionId = newUUID();
      server.send(
        JSON.stringify({
          action: {
            id: newUUID(),
            type: backend.actions.UPLOAD_FILE_PROGRESS,
          },
          payload: {
            'forActionId': forActionId,
            'currFile': 1,
            'numFiles': 1,
            'currChunk': 1,
            'numChunks': 1,
            'currFileName': "chucknorris.png",
          },
        })
      );

      rerender(projectRender({showAddGIS: false}));
      await waitFor(() => {
        expect(screen.queryByText("Select GIS Type")).not.toBeInTheDocument();
      });

      expect(toast.success).toHaveBeenCalledWith("File Upload successful for chucknorris.png", {
        position: "top-right",
        hideProgressBar: false,
        autoClose: 3000,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        toastId: forActionId,
        progress: undefined,
      });

      const GISTreeIcons = screen.getAllByAltText("GIS Data");
      expect(GISTreeIcons).toHaveLength(2);

      const dataset = {
        id: newUUID(),
        name: "Chuck Norris",
        type: "dataset_resource",
        locked: false,
        status: "Complete",
        attributes: {
          fromAction: newUUID()
        },
        created_by: "_staff_user",
        date_created: new Date(),
        description: "",
        display_type_plural: "Datasets",
        display_type_singular: "Dataset",
        organizations: [
          {
            id: newUUID(),
            name: "Test"
          }
        ],
        public: false,
        slug: "datasets",
        viz: {
          type: "wms",
          url: "http://localhost:8181/geoserver/wms/",
          layer: `tribs:${projectId}`,
          extent: [ // Do we want to mock the extents here?
            -111.65440426486374,
            34.57955911078993,
            -111.58361694982506,
            34.636153749951596
          ],
          origin: null
        },
        dataset_type: "FEATURES_SHAPEFILE",
        srid: "32612"
      };

      server.send(JSON.stringify({
        action: {
          id: newUUID(),
          type: backend.actions.DATASET_DATA
        },
        payload: dataset,
      }));

      rerender(projectRender());
      await pauseFor(500);
      const newDatasetTreeItem = screen.getByText(/Chuck Norris/);
      const newGISTreeIcons = screen.getAllByAltText("GIS Data");
      expect(newDatasetTreeItem).toBeInTheDocument();
      expect(newGISTreeIcons).toHaveLength(3);
    });

    it("Should open the Add Raster modal and add a dataset", async () => {
      const {
        user,
        rerender,
        projectRender,
        setShowAddRaster,
        server,
        backend,
        projectId,
      } = await setupProject();
      const addRasterButton = screen.getByRole("button", { name: "Add Raster" });
      await user.click(addRasterButton);
      expect(setShowAddRaster).toHaveBeenCalled();

      rerender(projectRender({showAddRaster: true}));
      expect(screen.getByText("Select Raster Type")).toBeInTheDocument();


      const someValues = [{ name: 'teresa teng' }];
      const str = JSON.stringify(someValues);
      const file = new File(["(⌐□_□)"], "chucknorris.png", { type: "image/png" });
      File.prototype.text = jest.fn().mockResolvedValueOnce(str);

      const fileInput = screen.getByLabelText(/File/);
      const nameInput = screen.getByLabelText(/Name/);
      const datasetTypeInput = screen.getByRole("combobox", { name: "Select Raster Type"});
      const submitButton = screen.getByTestId("add-raster-add-button");

      await user.upload(fileInput, file);
      expect(fileInput.files[0]).toBe(file);
      expect(fileInput.files).toHaveLength(1);
      expect(fileInput).toHaveValue("C:\\fakepath\\chucknorris.png");
      expect(nameInput).toHaveValue("chucknorris.png");

      await user.clear(nameInput);
      await user.type(nameInput, "Chuck Norris");
      expect(nameInput).toHaveValue("Chuck Norris");

      await user.selectOptions(datasetTypeInput, "RASTER_DISC_ASCII");
      expect(datasetTypeInput).toHaveValue("RASTER_DISC_ASCII");

      await user.click(submitButton);

      const invisibleFileError = screen.queryByText("Please select a valid geometry file (.stl, .gdf)");
      const invisibleNameError = screen.queryByText("Please provide a name for the Raster.");
      const invisibleDatasetTypeError = screen.queryByText("Please provide a type for the Raster.");

      // Validate initial state - expect not to be invalid
      expect(invisibleFileError).not.toBeInTheDocument();
      expect(invisibleNameError).not.toBeInTheDocument();
      expect(invisibleDatasetTypeError).not.toBeInTheDocument();

      await expect(server).toReceiveMessage(
        expect.stringContaining('"type":"UPLOAD_FILE"}')
      );

      const forActionId = newUUID();
      server.send(
        JSON.stringify({
          action: {
            id: newUUID(),
            type: backend.actions.UPLOAD_FILE_PROGRESS,
          },
          payload: {
            'forActionId': forActionId,
            'currFile': 1,
            'numFiles': 1,
            'currChunk': 1,
            'numChunks': 1,
            'currFileName': "chucknorris.png",
          },
        })
      );

      rerender(projectRender({showAddRaster: false}));
      await waitFor(() => {
        expect(screen.queryByText("Select Raster Type")).not.toBeInTheDocument();
      });

      expect(toast.success).toHaveBeenCalledWith("File Upload successful for chucknorris.png", {
        position: "top-right",
        hideProgressBar: false,
        autoClose: 3000,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        toastId: forActionId,
        progress: undefined,
      });

      const rasterTreeIcons = screen.getAllByAltText("Raster Data");
      expect(rasterTreeIcons).toHaveLength(4);

      const dataset = {
        id: newUUID(),
        name: "Chuck Norris",
        type: "dataset_resource",
        locked: false,
        status: "Complete",
        attributes: {
          fromAction: newUUID()
        },
        created_by: "_staff_user",
        date_created: new Date(),
        description: "",
        display_type_plural: "Datasets",
        display_type_singular: "Dataset",
        organizations: [
          {
            id: newUUID(),
            name: "Test"
          }
        ],
        public: false,
        slug: "datasets",
        viz: {
          type: "wms",
          url: "http://localhost:8181/geoserver/wms/",
          layer: `tribs:${projectId}`,
          extent: [ // Do we want to mock the extents here?
            -111.65440426486374,
            34.57955911078993,
            -111.58361694982506,
            34.636153749951596
          ],
          origin: null
        },
        dataset_type: "RASTER_DISC_ASCII",
        srid: "32612"
      };

      server.send(JSON.stringify({
        action: {
          id: newUUID(),
          type: backend.actions.DATASET_DATA
        },
        payload: dataset,
      }));

      rerender(projectRender());
      await pauseFor(500);
      const newDatasetTreeItem = screen.getByText(/Chuck Norris/);
      const newRasterTreeIcons = screen.getAllByAltText("Raster Data");
      expect(newDatasetTreeItem).toBeInTheDocument();
      expect(newRasterTreeIcons).toHaveLength(5);
    });

    it("Should open the Add Tabular modal and add a dataset", async () => {
      const {
        user,
        rerender,
        projectRender,
        setShowAddTabular,
        server,
        backend,
        projectId,
      } = await setupProject();
      const addTabularButton = screen.getByRole("button", { name: "Add Tabular" });
      await user.click(addTabularButton);
      expect(setShowAddTabular).toHaveBeenCalled();

      rerender(projectRender({showAddTabular: true}));
      expect(screen.getByText("Select Tabular Dataset Type")).toBeInTheDocument();


      const someValues = [{ name: 'teresa teng' }];
      const str = JSON.stringify(someValues);
      const file = new File(["(⌐□_□)"], "chucknorris.png", { type: "image/png" });
      File.prototype.text = jest.fn().mockResolvedValueOnce(str);

      const fileInput = screen.getByLabelText(/File/);
      const nameInput = screen.getByLabelText(/Name/);
      const datasetTypeInput = screen.getByRole("combobox", { name: "Select Tabular Dataset Type"});
      const submitButton = screen.getByTestId("add-tabular-dataset-add-button");

      await user.upload(fileInput, file);
      expect(fileInput.files[0]).toBe(file);
      expect(fileInput.files).toHaveLength(1);
      expect(fileInput).toHaveValue("C:\\fakepath\\chucknorris.png");
      expect(nameInput).toHaveValue("chucknorris.png");

      await user.clear(nameInput);
      await user.type(nameInput, "Chuck Norris");
      expect(nameInput).toHaveValue("Chuck Norris");

      await user.selectOptions(datasetTypeInput, "TRIBS_TABLE_SOIL");
      expect(datasetTypeInput).toHaveValue("TRIBS_TABLE_SOIL");

      await user.click(submitButton);

      const invisibleFileError = screen.queryByText("Please select a valid geometry file (.stl, .gdf)");
      const invisibleNameError = screen.queryByText("Please provide a name for the Tabular.");
      const invisibleDatasetTypeError = screen.queryByText("Please provide a type for the Tabular.");

      // Validate initial state - expect not to be invalid
      expect(invisibleFileError).not.toBeInTheDocument();
      expect(invisibleNameError).not.toBeInTheDocument();
      expect(invisibleDatasetTypeError).not.toBeInTheDocument();

      await expect(server).toReceiveMessage(
        expect.stringContaining('"type":"UPLOAD_FILE"}')
      );

      const forActionId = newUUID();
      server.send(
        JSON.stringify({
          action: {
            id: newUUID(),
            type: backend.actions.UPLOAD_FILE_PROGRESS,
          },
          payload: {
            'forActionId': forActionId,
            'currFile': 1,
            'numFiles': 1,
            'currChunk': 1,
            'numChunks': 1,
            'currFileName': "chucknorris.png",
          },
        })
      );

      rerender(projectRender({showAddTabular: false}));
      await waitFor(() => {
        expect(screen.queryByText("Select Tabular Dataset Type")).not.toBeInTheDocument();
      });

      expect(toast.success).toHaveBeenCalledWith("File Upload successful for chucknorris.png", {
        position: "top-right",
        hideProgressBar: false,
        autoClose: 3000,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        toastId: forActionId,
        progress: undefined,
      });

      const tabularTreeIcons = screen.getAllByAltText("Tabular Data");
      expect(tabularTreeIcons).toHaveLength(5);

      const dataset = {
        id: newUUID(),
        name: "Chuck Norris",
        type: "dataset_resource",
        locked: false,
        status: "Complete",
        attributes: {
          fromAction: newUUID()
        },
        created_by: "_staff_user",
        date_created: new Date(),
        description: "",
        display_type_plural: "Datasets",
        display_type_singular: "Dataset",
        organizations: [
          {
            id: newUUID(),
            name: "Test"
          }
        ],
        public: false,
        slug: "datasets",
        viz: {
          type: "wms",
          url: "http://localhost:8181/geoserver/wms/",
          layer: `tribs:${projectId}`,
          extent: [ // Do we want to mock the extents here?
            -111.65440426486374,
            34.57955911078993,
            -111.58361694982506,
            34.636153749951596
          ],
          origin: null
        },
        dataset_type: "TRIBS_TABLE_SOIL",
        srid: "32612"
      };

      server.send(JSON.stringify({
        action: {
          id: newUUID(),
          type: backend.actions.DATASET_DATA
        },
        payload: dataset,
      }));

      rerender(projectRender());
      await pauseFor(500);
      const newDatasetTreeItem = screen.getByText(/Chuck Norris/);
      const newRasterTreeIcons = screen.getAllByAltText("Tabular Data");
      expect(newDatasetTreeItem).toBeInTheDocument();
      expect(newRasterTreeIcons).toHaveLength(6);
    });
  });

  describe("Delete Datasets", () => {
    it("Should delete a Mesh Dataset", async () => {
      const {
        user,
        rerender,
        projectRender,
        server,
        backend,
      } = await setupProject();
      // Name for the dataset can be obtained from projectContext.
      // In this test I'm using a dataset with the TRIBS_TIN which is a mesh dataset type
      const datasetToBeDeleted = {
        "id": "2508e47b-e6dd-41da-9784-461049f013c3",
        "attributes": {},
        "created_by": "_staff_user",
        "date_created": new Date("2023-12-12T16:55:40.620460"),
        "description": "TIN for SALAS A.",
        "display_type_plural": "Datasets",
        "display_type_singular": "Dataset",
        "locked": false,
        "name": "TIN",
        "organizations": [
            {
                "id": "91b11d78-17f8-44bd-859f-2004ad8a37f4",
                "name": "Aquaveo"
            }
        ],
        "public": false,
        "slug": "datasets",
        "status": null,
        "type": "dataset_resource",
        "dataset_type": "TRIBS_TIN"
      };

      const datasetTreeItems = screen.getAllByText(datasetToBeDeleted.name);
      expect(datasetTreeItems).toHaveLength(2);
      const contextMenu = screen.getByRole("button", { name: `Options for ${datasetToBeDeleted.name}` }) // You put the name of the dataset here
      expect(contextMenu).toBeInTheDocument();

      await user.click(contextMenu);
      const deleteButton = await screen.findByRole("button", { name: /Delete/ });
      await user.click(deleteButton);

      await rerender(projectRender());
      const confirmDelete = screen.getByRole("button", { name: "Yes" })
      await user.click(confirmDelete);

      await expect(server).toReceiveMessage(
        expect.stringContaining(`"type":"DATASET_DELETE"},"payload":{"id":"${datasetToBeDeleted.id}"}`)
      );

      server.send(JSON.stringify({
        action: {
          id: newUUID(),
          type: backend.actions.DATASET_DELETE
        },
        payload: datasetToBeDeleted,
      }));

      await rerender(projectRender());
      await pauseFor(500);
      const deletedTreeItem = screen.getAllByText(datasetToBeDeleted.name)
      expect(deletedTreeItem).toHaveLength(1);
    });

    it("Should delete a GIS Dataset", async () => {
      const {
        user,
        rerender,
        projectRender,
        server,
        backend,
      } = await setupProject();
      // The dataset data can be obtained from projectContext.
      // In this test I'm using a dataset with the FEATURES_SHAPEFILE which is a GIS dataset type
      const datasetToBeDeleted = {
        id: '7b5c1ff1-1ece-4903-a16c-8c63a68da3c9',
        name: 'GIS Dataset',
        type: 'dataset_resource',
        locked: false,
        status: 'Complete',
        attributes: {},
        created_by: '_staff_user',
        date_created: "2024-10-19T00:47:36.279Z",
        description: '',
        display_type_plural: 'Datasets',
        display_type_singular: 'Dataset',
        organizations: [ { id: 'f1a4cb9c-f459-4373-a05b-75764beae970', name: 'Test' } ],
        public: false,
        slug: 'datasets',
        viz: {
          type: 'wms',
          url: 'http://localhost:8181/geoserver/wms/',
          layer: 'tribs:d7acd6c0-8f85-4a05-b53d-44aa46603710',
          extent: [
            -111.65440426486374,
            34.57955911078993,
            -111.58361694982506,
            34.636153749951596
          ],
          origin: null
        },
        dataset_type: 'FEATURES_SHAPEFILE',
        srid: '32612'
      };

      const datasetTreeItems = screen.getAllByText(datasetToBeDeleted.name);
      expect(datasetTreeItems).toHaveLength(1);
      const contextMenu = screen.getByRole("button", { name: `Options for ${datasetToBeDeleted.name}` }) // You put the name of the dataset here
      expect(contextMenu).toBeInTheDocument();

      await user.click(contextMenu);
      const deleteButton = await screen.findByRole("button", { name: /Delete/ });
      await user.click(deleteButton);

      await rerender(projectRender());
      const confirmDelete = screen.getByRole("button", { name: "Yes" })
      await user.click(confirmDelete);

      await expect(server).toReceiveMessage(
        expect.stringContaining(`"type":"DATASET_DELETE"},"payload":{"id":"${datasetToBeDeleted.id}"}`)
      );

      server.send(JSON.stringify({
        action: {
          id: newUUID(),
          type: backend.actions.DATASET_DELETE
        },
        payload: datasetToBeDeleted,
      }));

      await rerender(projectRender());
      await pauseFor(500);
      const deletedTreeItem = screen.queryByText(datasetToBeDeleted.name)
      expect(deletedTreeItem).not.toBeInTheDocument();
    });

    it("Should delete a Raster Dataset", async () => {
      const {
        user,
        rerender,
        projectRender,
        server,
        backend,
      } = await setupProject();
      // Dataset data can be obtained from projectContext.
      // In this test I'm using a dataset with the RASTER_DISC_ASCII which is a Raster dataset type
      const datasetToBeDeleted = {
        "id": "95bb70ff-d91c-4808-876b-ca7b04bc0cee",
        "attributes": {},
        "created_by": "_staff_user",
        "date_created": new Date("2023-12-12T16:55:38.293196"),
        "description": "Land Use Grid for SALAS A.",
        "display_type_plural": "Datasets",
        "display_type_singular": "Dataset",
        "locked": false,
        "name": "Land Use Grid",
        "organizations": [
          {
            "id": "91b11d78-17f8-44bd-859f-2004ad8a37f4",
            "name": "Aquaveo"
          }
        ],
        "public": false,
        "slug": "datasets",
        "status": null,
        "type": "dataset_resource",
        "dataset_type": "RASTER_DISC_ASCII"
      };

      const datasetTreeItems = screen.getAllByText(datasetToBeDeleted.name);
      expect(datasetTreeItems).toHaveLength(2);
      const contextMenu = screen.getByRole("button", { name: `Options for ${datasetToBeDeleted.name}` }) // You put the name of the dataset here
      expect(contextMenu).toBeInTheDocument();

      await user.click(contextMenu);
      const deleteButton = await screen.findByRole("button", { name: /Delete/ });
      await user.click(deleteButton);

      await rerender(projectRender());
      const confirmDelete = screen.getByRole("button", { name: "Yes" })
      await user.click(confirmDelete);

      await expect(server).toReceiveMessage(
        expect.stringContaining(`"type":"DATASET_DELETE"},"payload":{"id":"${datasetToBeDeleted.id}"}`)
      );

      server.send(JSON.stringify({
        action: {
          id: newUUID(),
          type: backend.actions.DATASET_DELETE
        },
        payload: datasetToBeDeleted,
      }));

      await rerender(projectRender());
      await pauseFor(500);
      const deletedTreeItem = screen.getAllByText(datasetToBeDeleted.name)
      expect(deletedTreeItem).toHaveLength(1);
    });

    it("Should delete a Tabular Dataset", async () => {
      const {
        user,
        rerender,
        projectRender,
        server,
        backend,
      } = await setupProject();
      // Dataset data can be obtained from projectContext.
      // In this test I'm using a dataset with the TRIBS_TABLE_SOIL which is a Tabular dataset type
      const datasetToBeDeleted = {
        "id": "7a3688c0-3c24-4b65-8008-2748ae07999a",
        "attributes": {},
        "created_by": "_staff_user",
        "date_created": new Date("2023-12-12T16:55:38.367918"),
        "description": "Soil Reclassification Table for SALAS A.",
        "display_type_plural": "Datasets",
        "display_type_singular": "Dataset",
        "locked": false,
        "name": "Soil Reclassification Table",
        "organizations": [
          {
            "id": "91b11d78-17f8-44bd-859f-2004ad8a37f4",
            "name": "Aquaveo"
          }
        ],
        "public": false,
        "slug": "datasets",
        "status": null,
        "type": "dataset_resource",
        "dataset_type": "TRIBS_TABLE_SOIL"
      };

      const datasetTreeItems = screen.getAllByText(datasetToBeDeleted.name);
      expect(datasetTreeItems).toHaveLength(2);
      const contextMenu = screen.getByRole("button", { name: `Options for ${datasetToBeDeleted.name}` }) // You put the name of the dataset here
      expect(contextMenu).toBeInTheDocument();

      await user.click(contextMenu);
      const deleteButton = await screen.findByRole("button", { name: /Delete/ });
      await user.click(deleteButton);

      await rerender(projectRender());
      const confirmDelete = screen.getByRole("button", { name: "Yes" })
      await user.click(confirmDelete);

      await expect(server).toReceiveMessage(
        expect.stringContaining(`"type":"DATASET_DELETE"},"payload":{"id":"${datasetToBeDeleted.id}"}`)
      );

      server.send(JSON.stringify({
        action: {
          id: newUUID(),
          type: backend.actions.DATASET_DELETE
        },
        payload: datasetToBeDeleted,
      }));

      await rerender(projectRender());
      await pauseFor(500);
      const deletedTreeItem = screen.getAllByText(datasetToBeDeleted.name)
      expect(deletedTreeItem).toHaveLength(1);
    });
  });
  //TODO Add Visibility tests when Compound-Dataset branch is merged.

  //TODO Add Compound Dataset tests when Compound-Dataset branch is merged.

  //TODO Add Backend tests in the Backend-Tests branch.
});
