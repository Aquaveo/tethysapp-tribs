import { FRAME_OBJECT, HOME } from "constants/GraphicsWindowConstants";
import PropTypes from "prop-types";
import { createContext, useEffect, useState } from "react";

export const AppContext = createContext();

// Modal Contexts
const ModalContext = createContext({
  showAddMesh: false,
  setShowAddMesh: () => {},
  showAddGIS: false,
  setShowAddGIS: () => {},
  showAddRaster: false,
  setShowAddRaster: () => {},
  showAddTabular: false,
  setShowAddTabular: () => {},
  showAddGenericDataset: false,
  setShowAddGenericDataset: () => {},
  showAddScenario: false,
  setShowAddScenario: () => {},
  modelControl: false,
  setShowModelControl: () => {},
  workflowsModal: false,
  setWorkflowsModal: () => {},
  realizationModelControl: false,
  setShowRealizationModelControl: () => {},
});

// General Project Context
const ProjectContext = createContext({
  isFirstProjectRender: true,
  setIsFirstProjectRender: () => {},
  openFolders: [],
  openFolder: () => {},
  closeFolder: () => {},
  projectId: null,
  setProjectId: () => {},
});

// Project Object Location
// This is for finding the where in the project a dataset is located
// It's used in the Model Control's Open X Dataset modals
const ProjectObjectContext = createContext({
  projectObjectLocation: null,
  setProjectObjectLocation: () => {},
  dataObject: null,
  setDataObject: () => {},
});

const GraphicsWindowVisualsContext = createContext({
  framedObject: {[HOME]: null, [FRAME_OBJECT]: null},
  setFramedObject: () => {},
  visibleObjects: null,
  hideObject: () => {},
  revealObject: () => {},
  updateFrame: false,
  setUpdateFrame: () => {},
  zoomToExtent: null,
  setZoomToExtent: () => {},
  visibleCZMLObject: null,
  setCZMLLayer: () => {},
  selectedCZMLPoint: null,
  setSelectedCZMLPoint: () => {},
  startDates: [],
  setStartDates: () => {},
});

const SidePanelContext = createContext({
  visibleSidePanel: [],
  showPanel: () => {},
  hideSidePanel: () => {},
});

// ReadOnly Dataset Context for accessing in child components
const DatasetContext = createContext({
  contextDatasets: [],
  setContextDatasets: () => {}
});

const AppContextProvider = ({ children }) => {
  // Modal States
  const [showAddMesh, setShowAddMesh] = useState(false);
  const [showAddGIS, setShowAddGIS] = useState(false);
  const [showAddRaster, setShowAddRaster] = useState(false);
  const [showAddTabular, setShowAddTabular] = useState(false);
  const [showAddGenericDataset, setShowAddGenericDataset] = useState(false);
  const [showAddScenario, setShowAddScenario] = useState(false);
  const [modelControl, setShowModelControl] = useState(false);
  const [workflowsModal, setWorkflowsModal] = useState(false);
  const [realizationModelControl, setShowRealizationModelControl] = useState(false);

  const modalContextValue = {
    showAddMesh,
    setShowAddMesh,
    showAddGIS,
    setShowAddGIS,
    showAddRaster,
    setShowAddRaster,
    showAddTabular,
    setShowAddTabular,
    showAddGenericDataset,
    setShowAddGenericDataset,
    showAddScenario,
    setShowAddScenario,
    modelControl,
    setShowModelControl,
    workflowsModal,
    setWorkflowsModal,
    realizationModelControl,
    setShowRealizationModelControl,
  };

  // General Project Context
  const [isFirstProjectRender, setIsFirstProjectRender] = useState(true);
  const [projectId, setProjectId] = useState(null);
  const [openFolders, setOpenFolders] = useState(() => {
    // Check if the window is defined on the client side.
    // This is useful for Server Side Rendered windows.
    if (typeof window === 'undefined') {
      return [];
    }
    // If there is ever a problem where the project state isn't saving,
    // check that the localStorage is under 5 MB

    // Local Storage is useful for keeping the same data across all tabs
    // However only strings can be stored in the sessionStorage and localStorage.
    // Because of that, this will need to be parsed and stringified.
    // sessionStorage is non-permanent and is deleted when the browser is closed
    // localStorage is more permanent and will persist after closing the browser
    const storedOpenFoldersString = window.localStorage.getItem('openFolders');
    const storedOpenFolders = JSON.parse(storedOpenFoldersString);
    return storedOpenFolders ?? {};
  });

  useEffect(() => {
    // Update the local Storage whenever the openFolders are changed
    localStorage.setItem('openFolders', JSON.stringify(openFolders));
  }, [openFolders]);

  const openFolder = (treeItemId) => {
    setOpenFolders((prevFolders) => {
      // Initialize the projectId array if it doesn't exist
      const updatedFolders = {
        ...prevFolders,
        [projectId]: prevFolders[projectId] ? [...prevFolders[projectId]] : [],
      };

      // Add treeItemId to the hiddenFolders array if it's not already there
      if (!updatedFolders[projectId].includes(treeItemId)) {
        updatedFolders[projectId].push(treeItemId);
      }

      return updatedFolders; // Return the updated state
    });
  };

  const closeFolder = (treeItemId) => {
    setOpenFolders((prevFolders) => {
      // Check if the projectId exists in prevFolders
      if (!prevFolders[projectId]) {
        return prevFolders; // Return the previous state if projectId doesn't exist
      }

      // Remove treeItemId from the hiddenFolders array
      return {
        ...prevFolders,
        [projectId]: prevFolders[projectId].filter(id => id !== treeItemId),
      };
    });
  };

  const ProjectContextValue = {
    isFirstProjectRender,
    setIsFirstProjectRender,
    openFolders,
    closeFolder,
    openFolder,
    projectId,
    setProjectId,
  };

  // Project Object Location
  // This is for finding the where in the project a dataset is located
  // It's used in the Model Control's Open X Dataset modals
  const [projectObjectLocation, setProjectObjectLocation] = useState(null);
  const [dataObject, setDataObject] = useState();

  const ProjectObjectContextValue = {
    projectObjectLocation,
    setProjectObjectLocation,
    dataObject,
    setDataObject,
  }

  // Graphics Window Visuals
  const [framedObject, setNewFramedObject] = useState({[HOME]: null, [FRAME_OBJECT]: null});
  const [visibleObjects, setVisibleObjects] = useState(() => {
    // Check if the window is defined on the client side.
    // This is useful for Server Side Rendered windows.
    if (typeof window === 'undefined') {
      return [];
    }
    // If there is ever a problem where the project state isn't saving,
    // check that the localStorage is under 5 MB

    // Local Storage is useful for keeping the same data across all tabs
    // However only strings can be stored in the sessionStorage and localStorage.
    // Because of that, this will need to be parsed and stringified.
    // sessionStorage is non-permanent and is deleted when the browser is closed
    // localStorage is more permanent and will persist after closing the browser
    const storedVisibleObjectsString = window.localStorage.getItem('visibleObjects');
    const storedVisibleObjects = JSON.parse(storedVisibleObjectsString);
    return storedVisibleObjects ?? {};
  });
  const [updateFrame, setUpdateFrame] = useState(false);
  const [zoomToExtent, setZoomToExtent] = useState(null);
  const [visibleCZMLObject, setVisibleCZMLObject] = useState({});
  const [selectedCZMLPoint, setSelectedCZMLPoint] = useState(null);
  const [startDates, setStartDates] = useState([]);

  const setFramedObject = (extent, key) => {
    setNewFramedObject((prevObjects) => ({...prevObjects, [key]: extent}))
  };

  useEffect(() => {
    // Update the local Storage whenever the visibleObjects are changed
    localStorage.setItem('visibleObjects', JSON.stringify(visibleObjects));
  }, [visibleObjects]);

  const revealObject = (datasetID) => {
    setVisibleObjects((prevObjects) => {
      const updatedObjects = {
        ...prevObjects,
        [projectId]: prevObjects[projectId] ? [...prevObjects[projectId]] : [],
      }

      // Add datasetID to the visibleObjects array if it's not already there
      if (!updatedObjects[projectId].includes(datasetID)) {
        updatedObjects[projectId].push(datasetID);
      }
  
      return updatedObjects; // Return the updated state
    });
  };

  const hideObject = (datasetID) => {
    setVisibleObjects((prevObjects) => {
      // Check if the projectId exists in prevObjects
      if (!prevObjects[projectId]) {
        return prevObjects; // Return the previous state if projectId doesn't exist
      }

      // Filter out the datasetID from the visibleObjects array
      return {
        ...prevObjects,
        [projectId]: prevObjects[projectId].filter(id => id !== datasetID),
      };
    });
  };

  const setCZMLLayer = (datasetID, layerName) => {
    setVisibleCZMLObject((prevObjects) => {
      return { ...prevObjects, [datasetID]: layerName };
    });
  };

  const VisualsContextValue = {
    framedObject,
    setFramedObject,
    visibleObjects,
    hideObject,
    revealObject,
    updateFrame,
    setUpdateFrame,
    zoomToExtent,
    setZoomToExtent,
    visibleCZMLObject,
    setCZMLLayer,
    selectedCZMLPoint,
    setSelectedCZMLPoint,
    startDates,
    setStartDates,
  };

  const [visibleSidePanel, setVisibleSidePanel] = useState([]);

  const hideSidePanel = (panelId) => {
    setVisibleSidePanel((prevPanels) => {
      // Remove panelId from the hiddenPanels array
      return prevPanels.filter(id => id !== panelId);
    });
  };

  const showPanel = (panelId) => {
    setVisibleSidePanel((prevPanels) => {
      return [ ...prevPanels, panelId ];
    });
  }

  const SidePanelContextValue = {
    visibleSidePanel,
    hideSidePanel,
    showPanel,
  }

  const [contextDatasets, setContextDatasets] = useState([]);

  const DatasetContextValue = {
    // This is meant as a ReadOnly list of datasets
    // to access the full list of datasets to compare
    // values across all components in the stack.

    // The main use is for accessing dataset_type
    // in the ModelTreeItem.
    contextDatasets,
    setContextDatasets,
  }

  return (
    <ProjectContext.Provider value={ProjectContextValue}>
      <ProjectObjectContext.Provider value={ProjectObjectContextValue}>
        <DatasetContext.Provider value={DatasetContextValue}>
          <ModalContext.Provider value={modalContextValue}>
            <GraphicsWindowVisualsContext.Provider value={VisualsContextValue}>
              <SidePanelContext.Provider value={SidePanelContextValue}>
                {children}
              </SidePanelContext.Provider>
            </GraphicsWindowVisualsContext.Provider>
          </ModalContext.Provider>
        </DatasetContext.Provider>
      </ProjectObjectContext.Provider>
    </ProjectContext.Provider>
  );
};

AppContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AppContextProvider;
export {
  ModalContext,
  ProjectContext,
  ProjectObjectContext,
  GraphicsWindowVisualsContext,
  SidePanelContext,
  DatasetContext
};