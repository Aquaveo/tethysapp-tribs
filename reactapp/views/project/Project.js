import PropTypes from "prop-types";
import { useState, useContext, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import {
  AppContext,
  ModalContext,
  ProjectObjectContext,
  ProjectContext,
  GraphicsWindowVisualsContext,
  DatasetContext
} from "react-tethys/context";

// Main Project Imports
import GraphicsWindow from "components/graphics-window/GraphicsWindow";
import Panel from "components/panel/Panel";
import FileUploadToastMessage from "components/project/dialogs/FileUploadToastMessage";

// Tree Item Imports
import TreeItem from "components/tree/TreeItem";
import MeshTreeItem from "components/project/tree-items/MeshTreeItem";
import GISTreeItem from "components/project/tree-items/GISTreeItem";
import RasterTreeItem from "components/project/tree-items/RasterTreeItem";
import TabularTreeItem from "components/project/tree-items/TabularTreeItem";
import ScenarioTreeItem from "components/project/tree-items/ScenarioTreeItem";
import CompoundRasterTreeItem from "components/project/tree-items/CompoundRasterTreeItem";
import RealizationTreeItem from "components/project/tree-items/RealizationTreeItem";

// Modal Imports
import AddMeshModal from "components/project/dialogs/AddMeshModal";
import AddGISModal from "components/project/dialogs/AddGISModal";
import AddRasterModal from "components/project/dialogs/AddRasterModal";
import AddTabularModal from "components/project/dialogs/AddTabularModal";
import AddGenericDatasetModal from "components/project/dialogs/AddGenericDatasetModal";
import AddScenarioModal from "components/project/dialogs/AddScenarioModal";
import ModelControl from "components/project/dialogs/ModelControl";
import WorkflowsModal from "components/project/dialogs/WorkflowsModal";
import ReconnectingModal from "components/project/dialogs/ReconnectingBackendModal";

// Action Imports
import AddAction from "components/project/actions/AddAction";
import CollectionVisibilityAction from "components/project/actions/CollectionVisibilityAction";

// Icon Imports
import Icon from 'assets/Icon';
import GenericFolder from 'assets/Generic_Folder.svg';
import TIN_Module_Icon from 'assets/TIN_Module_Icon.svg';
import Polygons from 'assets/Polygons.svg';
import Scalar_Dataset from 'assets/Scalar_Dataset_Active.svg';

// Constants/Misc imports
import { filterDatasets, sortDatasetsByKey } from "../../components/project/utils/DatasetCreation";
import * as ProjectConstants from "constants/projectConstants";
import { FRAME_OBJECT, HOME, USA_EXTENT } from "constants/GraphicsWindowConstants";

const Project = ({ project, setProject }) => {
  const TETHYS_ROOT_URL = process.env.TETHYS_APP_ROOT_URL;
  const { backend } = useContext(AppContext);
  const { setIsFirstProjectRender, projectId, setProjectId } = useContext(ProjectContext);
  const isFirstProjectRenderRef = useRef(true);

  const [reconnecting, setReconnecting] = useState(false);
  const [disconnected, setDisconnected] = useState(false);

  useEffect(() => {
    if (!projectId) {
      // TODO Add tests for this.
      setProjectId(project.id)
    }
  }, [project.id, projectId, setProjectId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isFirstProjectRenderRef.current) {
        isFirstProjectRenderRef.current = false;
        setIsFirstProjectRender(false)
      }
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [setIsFirstProjectRender]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (toast.isActive("toast-reconnect")) {
        // TODO Add tests for this.
        setReconnecting(true);
      } else if (toast.isActive("toast-disconnect")) {
        // TODO Add tests for this.
        setDisconnected(true);
      } else {
        setReconnecting(false);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [realizationIndex, setRealizationIndex] = useState(0);

  /**
   * Sort Keys for whenever they want to be added to the UI
   * This will sort ALL datasets in their respective folders.
  */
  // eslint-disable-next-line no-unused-vars
  const [datasetSortKey, setDatasetSortKey] = useState(ProjectConstants.SORT_KEYS.NAME);
  // eslint-disable-next-line no-unused-vars
  const datasetSortKeyRef = useRef(ProjectConstants.SORT_KEYS.NAME);
  // eslint-disable-next-line no-unused-vars
  const [isAscendingSort, setAscendingSort] = useState(true);

  const [datasets, setDatasets] = useState(sortDatasetsByKey(project.datasets, datasetSortKey));
  const { setContextDatasets } = useContext(DatasetContext);
  useEffect(() => {
    // Only set the contextDatasets in this component.
    // Everywhere else it is meant to be ReadOnly.
    setContextDatasets(datasets);
  }, [datasets, setContextDatasets]);

  const [filteredDatasets, setFilteredDatasets] = useState({
    [ProjectConstants.DATASET_GROUPS.MESH]: filterDatasets(
      datasets,
      ProjectConstants.DATASET_GROUPS.MESH,
      datasetSortKey,
      isAscendingSort
    ),
    [ProjectConstants.DATASET_GROUPS.GIS]: filterDatasets(
      datasets,
      ProjectConstants.DATASET_GROUPS.GIS,
      datasetSortKey,
      isAscendingSort
    ),
    [ProjectConstants.DATASET_GROUPS.RASTER]: filterDatasets(
      datasets,
      ProjectConstants.DATASET_GROUPS.RASTER,
      datasetSortKey,
      isAscendingSort
    ),
    [ProjectConstants.DATASET_GROUPS.TABULAR]: filterDatasets(
      datasets,
      ProjectConstants.DATASET_GROUPS.TABULAR,
      datasetSortKey,
      isAscendingSort
    ),
    [ProjectConstants.DATASET_GROUPS.OTHER]: filterDatasets(
      datasets,
      ProjectConstants.DATASET_GROUPS.OTHER,
      datasetSortKey,
      isAscendingSort
    ),
  });

  useEffect(() => {
    if (datasetSortKey === ProjectConstants.SORT_KEYS.MANUAL) {
      // This is where you can implement the manual sort method
    } else {
      setFilteredDatasets({
        [ProjectConstants.DATASET_GROUPS.MESH]: filterDatasets(
          datasets,
          ProjectConstants.DATASET_GROUPS.MESH,
          datasetSortKey,
          isAscendingSort
        ),
        [ProjectConstants.DATASET_GROUPS.GIS]: filterDatasets(
          datasets,
          ProjectConstants.DATASET_GROUPS.GIS,
          datasetSortKey,
          isAscendingSort
        ),
        [ProjectConstants.DATASET_GROUPS.RASTER]: filterDatasets(
          datasets,
          ProjectConstants.DATASET_GROUPS.RASTER,
          datasetSortKey,
          isAscendingSort
        ),
        [ProjectConstants.DATASET_GROUPS.TABULAR]: filterDatasets(
          datasets,
          ProjectConstants.DATASET_GROUPS.TABULAR,
          datasetSortKey,
          isAscendingSort
        ),
        [ProjectConstants.DATASET_GROUPS.OTHER]: filterDatasets(
          datasets,
          ProjectConstants.DATASET_GROUPS.OTHER,
          datasetSortKey,
          isAscendingSort
        ),
      });
    }
  }, [datasets, datasetSortKey, isAscendingSort]);

  useEffect(() => {
    if (datasetSortKey === ProjectConstants.SORT_KEYS.MANUAL) {
      // This is where you can implement the manual sort method
    } else {
      setDatasets(
        sortDatasetsByKey(project.datasets, datasetSortKey, isAscendingSort)
      );
    }
  }, [project.datasets, datasetSortKey, isAscendingSort]);

  const [workflows, setWorkflows] = useState({});

  const {showAddMesh, setShowAddMesh} = useContext(ModalContext);
  const closeAddMesh = () => {
    setShowAddMesh(false);
  };
  const openAddMesh = () => {
    setShowAddMesh(true);
  };

  const {showAddGIS, setShowAddGIS} = useContext(ModalContext);
  const closeAddGIS = () => {
    setShowAddGIS(false);
  };
  const openAddGIS = () => {
    setShowAddGIS(true);
  };

  const {showAddRaster, setShowAddRaster} = useContext(ModalContext);
  const closeAddRaster = () => {
    setShowAddRaster(false);
  };
  const openAddRaster = () => {
    setShowAddRaster(true);
  };

  const {showAddTabular, setShowAddTabular} = useContext(ModalContext);
  const closeAddTabular = () => {
    setShowAddTabular(false);
  };
  const openAddTabular = () => {
    setShowAddTabular(true);
  };

  const {showAddGenericDataset, setShowAddGenericDataset} = useContext(ModalContext);
  const closeAddGenericDataset = () => {
    // TODO Add tests for this.
    setShowAddGenericDataset(false);
  };

  const [realizationData, setRealizationData] = useState(() => {
    if (!project || !project.scenarios || project.scenarios.length < 1) {
      return [];
    }
    const realizations = project.scenarios.flatMap((scenario) =>
      scenario.realizations.map((realization) => ({
        ...realization,
        scenario_id: scenario.id,
        scenario_name: scenario.name,
        date_created: new Date(realization.date_created),
        input_file: {
          ...realization.input_file,
          run_parameters: {
            ...realization.input_file.run_parameters,
            time_variables: {
              ...realization.input_file.run_parameters.time_variables,
              STARTDATE: new Date(realization.input_file.run_parameters.time_variables.STARTDATE)
            }
          }
        }
      }))
    );
    return realizations;
  });

  const { startDates, setStartDates } = useContext(GraphicsWindowVisualsContext);

  useEffect(() => {
    setStartDates(realizationData.map((realization) => (
      new Date(realization.input_file.run_parameters.time_variables.STARTDATE)
    )))
  }, [realizationData, setStartDates])

  const [scenarioData, setScenarioData] = useState(() => {
    if (!project || !project.scenarios || project.scenarios.length < 1) {
      return [];
    }

    return project.scenarios.map((scenario) => {
      const realizations = scenario.realizations.map((realization) => ({
        ...realization,
        scenario_id: scenario.id,
        scenario_name: scenario.name,
        date_created: new Date(realization.date_created),
        input_file: {
          ...realization.input_file,
          run_parameters: {
            ...realization.input_file.run_parameters,
            time_variables: {
              ...realization.input_file.run_parameters.time_variables,
              STARTDATE: new Date(realization.input_file.run_parameters.time_variables.STARTDATE)
            }
          }
        }
      }));
      return ({
        ...scenario,
        date_created: new Date(scenario.date_created),
        realizations: [...realizations],
        input_file: {
          ...scenario.input_file,
          run_parameters: {
            ...scenario.input_file.run_parameters,
            time_variables: {
              ...scenario.input_file.run_parameters.time_variables,
              STARTDATE: new Date(scenario.input_file.run_parameters.time_variables.STARTDATE)
            }
          }
        }
      });
    });
  });

  const {showAddScenario, setShowAddScenario} = useContext(ModalContext);

  const closeAddScenario = () => {
    setShowAddScenario(false);
  };
  const openAddScenario = () => {
    setShowAddScenario(true);
  };
  
  const {modelControl, setShowModelControl} = useContext(ModalContext);

  const closeModelControl = () => {
    setShowModelControl(false);
  };
  const openModelControl = () => {
    setShowModelControl(true);
  };

  const {realizationModelControl, setShowRealizationModelControl} = useContext(ModalContext);

  const closeRealizationModelControl = () => {
    // TODO Add tests for this.
    setShowRealizationModelControl(false);
  };
  const openRealizationModelControl = () => {
    setShowRealizationModelControl(true);
  };

  const {workflowsModal, setWorkflowsModal} = useContext(ModalContext);
  const closeWorkflows = () => {
    setWorkflowsModal(false);
  }

  const [fileProgress, setFileProgress] = useState({});
  const [updateToast, setUpdateToast] = useState(false);

  const changeFileProgress = (fileProgressData) => {
    const currProgress = (fileProgressData.currChunk / fileProgressData.numChunks);
    const actionId = fileProgressData.forActionId;
    const newFileProgressData = {...fileProgressData, progress: currProgress}
    if (fileProgress[actionId]) {
      if (currProgress > fileProgress[actionId].progress){ 
        // TODO Add tests for this.
        setFileProgress((prevFileProgress) => ({
          ...prevFileProgress,
          [actionId]: newFileProgressData
        }));
        setUpdateToast(true);
      }
    } else {
      setFileProgress((prevFileProgress) => ({
        ...prevFileProgress,
        [actionId]: newFileProgressData
      }));
      setUpdateToast(true);
    }
  };

  const removeFileProgress = (fileName) => {
    setFileProgress((prevFileProgress) => {
      const newFileProgress = { ...prevFileProgress };
      delete newFileProgress[fileName];
      return newFileProgress;
    });
  };

  const { setDataObject, projectObjectLocation } = useContext(ProjectObjectContext);

  /******************** Scenario Backend Setup ********************/
  backend.on(backend.actions.SCENARIO_DATA, (data) => {
    // TODO Add tests for this.
    const index = scenarioData.findIndex((s) => s.id === data.id)
    if (index >= 0) {
      console.log("Updating Scenarios...")
      updateScenario(data);
    } else {
      console.log("Adding New Scenario...");
      addScenario(data);
    }
  });

  backend.on(backend.actions.SCENARIO_DELETE, (data) => {
    // TODO Add tests for this.
    deleteScenario(data);
  });

  backend.on(backend.actions.SCENARIO_LINK_DATASET, (data) => {
    // TODO Add tests for this.
    updateScenario(data);
  });

  backend.on(backend.actions.MESSAGE_ERROR, (error) => {
    // TODO Add tests for this.
    toast.error(error.message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  });

  backend.on(backend.actions.DATASET_PROCESSING_PROGRESS, (progressData) => {
    // TODO Add tests for this.
    const toastId = `progress-process-${progressData.id}`
    toast.loading(progressData.progress.message, {
      position: "top-right",
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      toastId: toastId,
      theme: "colored",
      type: "info",
    });

    if (progressData.progress.status === "Complete") {
      toast.update(toastId, {
        render: progressData.progress.message,
        type: "success",
        isLoading: false,
        autoClose: 5000,
        hideProgressBar: false,
      })
    } else if (progressData.progress.status === "Error") {
      toast.update(toastId, {
        render: progressData.progress.message,
        type: "error",
        isLoading: false,
        autoClose: 5000,
        hideProgressBar: false,
      })
    }
  });

  /******************** Realization Backend Setup ********************/
  backend.on(backend.actions.REALIZATION_DATA, (data) => {
    // TODO Add tests for this.
    const index = realizationData.findIndex((r) => r.id === data.id)
    if (index >= 0) {
      console.log("Updating Realizations...")
      updateRealization({...data, scenario_name: realizationData[index].scenario_name});
    } else {
      throw new Error("Realization does not exist yet", data);
    }
  });

  backend.on(backend.actions.REALIZATION_DELETE, (data) => {
    // TODO Add tests for this.
    deleteRealization(data);
  });

  backend.on(backend.actions.REALIZATION_UPDATE, (data) => {
    // TODO Add tests for this.
    const existingRealization = realizationData.find((r) => r.id === data.id);
    updateRealization({...data, scenario_name: existingRealization.scenario_name});
  });

  /******************** Workflow Backend Setup ********************/
  backend.on(backend.actions.WORKFLOW_DATA_ALL, (data) => {
    // TODO Add tests for this.
    setWorkflows(data);
  });

  /************************ Datasets ************************/

  const { setFramedObject, setZoomToExtent, framedObject } = useContext(GraphicsWindowVisualsContext);

  useEffect(() => {
    if (
      project?.attributes?.project_extent !== null &&
      project?.attributes?.project_extent !== undefined
    ) {
      const projectExtent = project.attributes.project_extent;
      // Only update framedObject if it does not already match projectExtent
      if (framedObject[HOME] !== projectExtent) {
        setFramedObject(projectExtent, HOME);
        setZoomToExtent(HOME)
      }
    } else if (framedObject[HOME] === null) {
      // Only set to USA_EXTENT if framedObject[HOME] is actually null
      if (framedObject[HOME] !== USA_EXTENT) {
        setFramedObject(USA_EXTENT, HOME);
      }
    }
  }, [project, setFramedObject, framedObject, setZoomToExtent]);

  const addDataset = (data) => {
    setDatasets((prevDatasets) => {
      const allDatasets = [...prevDatasets, data];
      const sorted_datasets = sortDatasetsByKey(allDatasets, datasetSortKey, isAscendingSort)
      return sorted_datasets;
    });
    if (data?.viz) {
      // TODO Add tests for this.
      setFramedObject(data.viz.extent, FRAME_OBJECT);
      setZoomToExtent(FRAME_OBJECT);
      // The check to see if a dataset isn't in the visibleObjects is handled in the revealObject already
      revealObject(data.id);
      if (data?.viz?.layer) {
        if (data.viz.layer.length > 0) {
          revealObject(data.viz.layer[0]);
        }
      }
    }
  };

  const deleteDataset = (data) => {
    setDatasets((prevDatasets) => {
      const currentDataset = prevDatasets.find((dataset) => dataset.id = data.id);
      if (currentDataset.viz) {
        // Removes the dataset from visibleObjects as cleanup
        hideObject(data.id);
      }

      const allDatasets = [...prevDatasets.filter((dataset) => dataset.id !== data.id)];
      const sorted_datasets = sortDatasetsByKey(allDatasets, datasetSortKey, isAscendingSort)
      return sorted_datasets;
    });
  };

  const updateDataset = (data) => {
    // TODO Add tests for this.
    setDatasets((prevDatasets) => {
      const index = prevDatasets.findIndex((dataset) => dataset.id === data.id);
      prevDatasets[index] = data;
      return([...prevDatasets])
    });
  }

  /******************** Dataset Backend Setup ********************/
  // This Updates/Adds New Datasets
  backend.on(backend.actions.DATASET_DATA, (data) => {
    const actualDataIndex = datasets.findIndex((d) => d.id === data.id);

    if (actualDataIndex >= 0) {
      console.log("Updating Datasets...")
      updateDataset(data);
    } else {
      console.log("Adding New Dataset...");
      addDataset(data);
    }

    // Updates the Object Location that should already exist from the backend.do
    const actionId = data.attributes.fromAction;
    setDataObject((prevDataObject) => {
      // TODO Add tests for this.
      if (prevDataObject) {
        const currentDataObject = prevDataObject[actionId];
        const newDataObject = {...currentDataObject, ...data}
        return ({ ...prevDataObject, [actionId]: newDataObject });
      }
    })
  });

  backend.on(backend.actions.DATASET_DELETE, (data) => {
    const actualDataIndex = datasets.findIndex((d) => d.id === data.id);
    if (actualDataIndex >= 0) {
      console.log("Deleting Dataset...");
      deleteDataset(data);
    } else {
      console.debug("Something isn't right with DATASET_DELETE")
    }
  });

  backend.on(backend.actions.SCENARIO_LINK_DATASET, (data) => {
    // TODO Add tests for this.
    updateScenario(data);
  });

  /************************ ScenarioData ************************/
  const addScenario = (scenario) => {
    // TODO Add tests for this.
    const newScenario = {
      ...scenario,
      date_created: new Date(scenario.date_created),
      input_file: {
        ...scenario.input_file,
        run_parameters: {
          ...scenario.input_file.run_parameters,
          time_variables: {
            ...scenario.input_file.run_parameters.time_variables,
            STARTDATE: new Date(scenario.input_file.run_parameters.time_variables.STARTDATE)
          }
        }
      }
    };
    setScenarioData((oldScenario) => [...oldScenario, newScenario]);
  };

  const deleteScenario = (scenario) => {
    // TODO Add tests for this.
    const oldScenario = [...scenarioData];
    const index = oldScenario.findIndex((s) => s.id === scenario.id);

    const newScenario = scenarioData.filter((s, i) => index !== i);
    setScenarioData(newScenario ?? []);
  };

  const updateScenario = (scenario) => {
    // TODO Add tests for this.
    const newScenario = [...scenarioData];
    const index = newScenario.findIndex((s) => s.id === scenario.id);
    newScenario[index] = scenario;
    setScenarioData(newScenario);
  };

  const updateScenarioIndex = (scenarioIndex) => {
    setScenarioIndex(scenarioIndex)
  };

  /*************** Scenario Backend Actions ***************/
  const handleAddScenarioSubmit = ({name}) => {
    // TODO Add tests for this.
    backend.do(backend.actions.SCENARIO_CREATE, {name: name, description: ""})
  };

  const handleDeleteScenario = (scenarioID) => {
    // TODO Add tests for this.
    backend.do(backend.actions.SCENARIO_DELETE, {id: scenarioID})
  };

  const handleUpdateScenario = (scenario) => {
    // TODO Add tests for this.
    backend.do(backend.actions.SCENARIO_UPDATE, scenario)
  };

  const handleUpdateScenarioInputFiles = (scenario) => {
    // TODO Add tests for this.
    backend.do(backend.actions.SCENARIO_UPDATE_INPUTFILE, scenario)
  };

  const handleDuplicateScenario = (scenarioID) => {
    // TODO Add tests for this.
    backend.do(backend.actions.SCENARIO_DUPLICATE, {id: scenarioID})
  };

  /************************ RealizationData ************************/
  const deleteRealization = (realization) => {
    // TODO Add tests for this.
    const oldRealization = [...realizationData];
    const index = oldRealization.findIndex((r) => r.id === realization.id);

    const newRealization = realizationData.filter((r, i) => index !== i);
    setRealizationData(newRealization ?? []);

    const newStartDates = startDates.filter((r, i) => index !== i);
    setStartDates(newStartDates ?? []);
  };

  const updateRealization = (realization) => {
    // TODO Add tests for this.
    const newRealization = [...realizationData];
    const index = newRealization.findIndex((r) => r.id === realization.id);
    newRealization[index] = realization;
    setRealizationData(newRealization);

    const newStartDates = [...startDates];
    const startDate = newRealization.input_file.run_parameters.time_variables.STARTDATE;
    newStartDates[index] = startDate
    setStartDates(newStartDates);
  };

  const updateRealizationIndex = (realizationIndex) => {
    // TODO Add tests for this.
    setRealizationIndex(realizationIndex)
  };

  /*************** Realization Backend Actions ***************/
  const handleDeleteRealization = (realizationID) => {
    // TODO Add tests for this.
    backend.do(backend.actions.REALIZATION_DELETE, {id: realizationID})
  };

  const handleUpdateRealization = (realization) => {
    // TODO Add tests for this.
    backend.do(backend.actions.REALIZATION_UPDATE, realization)
  };

  /*************** Dataset Backend Actions ***************/

  const handleAddDatasetSubmit = ({
    name,
    files,
    type,
    srid,
  }) => {
    const actionId = backend.do(
      backend.actions.DATASET_CREATE,
      {files, name, dataset_type: type, srid, description: ""}
    );

    if (projectObjectLocation) {
      // Initializes the new Project Object Location.
      // This is for updating the file select dropdown in the Model Control.
      // TODO Add tests for this.
      setDataObject((prevDataObjects) => (
        { ...prevDataObjects, [actionId]: {objectLocation: projectObjectLocation} }
      ));
    }
  };

  const handleDeleteDataset = (datasetID) => {
    backend.do(backend.actions.DATASET_DELETE, {id: datasetID})
  };

  const handleUpdateDataset = (dataset) => {
    // TODO Add tests for this.
    backend.do(backend.actions.DATASET_UPDATE, dataset)
  };

  const handleDuplicateDataset = (datasetID) => {
    // TODO Add tests for this.
    backend.do(backend.actions.DATASET_DUPLICATE, {id: datasetID})
  };

  backend.on(backend.actions.UPLOAD_FILE_PROGRESS, (fileProgressData) => {
    changeFileProgress(fileProgressData);
  });

  // Changing visibility for a collection
  const { hideObject, revealObject, visibleObjects } = useContext(GraphicsWindowVisualsContext);

  const setVisibilityAll = (collection, visibility) => {
    // TODO Add tests for this.
    if (!visibility) {
      collection.forEach(
        (dataset) => {
          hideObject(dataset.id);
          if (dataset?.viz?.layer) {
            // This is for compound datasets
            if (Array.isArray(dataset.viz.layer)) {
              dataset.viz.layer.forEach(layer => hideObject(layer));
            }
          }
        }
      );
    } else {
      collection.forEach(
        (dataset) => {
          revealObject(dataset.id);
          if (dataset?.viz?.layer) {
            // This is for compound datasets
            if (Array.isArray(dataset.viz.layer)) {
              dataset.viz.layer.forEach(layer => revealObject(layer));
            }
          }
        }
      );
    }
  };

  return (
    <div>
      <GraphicsWindow datasets={filteredDatasets}/>
      <Panel
        title="Project"
        width="348px"
        height="75vh"
        placement="left"
        homeURL={`${TETHYS_ROOT_URL}`}
        isProject
      >
        <TreeItem
          title={project.name}
          icon={<Icon src={GenericFolder} altText="Folder" />}
          uniqueId={project.id}
          defaultOpen
        >
          <TreeItem
            title="Mesh Data"
            icon={<Icon src={GenericFolder} altText="Folder" />}
            uniqueId={project.id}
            actions={[
              <CollectionVisibilityAction
                inline
                key="mesh-visibility"
                onClick={(evt, on) => {
                  setVisibilityAll(filteredDatasets[ProjectConstants.DATASET_GROUPS.MESH].datasets, on);
                }}
                disabled={!filteredDatasets[ProjectConstants.DATASET_GROUPS.MESH].datasets.length}
                off={
                  filteredDatasets[ProjectConstants.DATASET_GROUPS.MESH].datasets.every(
                    (dataset) => {
                      if (visibleObjects?.[projectId] !== undefined) {
                        return !visibleObjects?.[projectId].includes(dataset.id);
                      }
                      return true;
                    }
                  )
                }
              />,
              <AddAction 
                title="Add Mesh"
                key="mesh-add"
                onClick={openAddMesh}
                inline
              />,
            ]}
          >
            {filteredDatasets[ProjectConstants.DATASET_GROUPS.MESH].datasets.map((dataset, i) => {
              if (dataset.attributes?.compound !== null && dataset.attributes?.compound === true) {
                return (
                  <TreeItem
                    key={dataset.name}
                    title={ProjectConstants.DATASET_TYPE_TO_NORMALIZED_STRING[dataset.dataset_type]}
                    icon={<Icon src={TIN_Module_Icon} altText="Compound Dataset" />}
                  >
                    {dataset.files.map((mesh, j) => (
                      <MeshTreeItem
                        mesh={mesh}
                        datasetIndex={i}
                        deletable={false}
                        duplicatable={false}
                        renameable={false}
                        key={"mesh-compound-tree-item-" + j}
                      />
                    ))}
                  </TreeItem>
                );
              } else {
                return (
                  <MeshTreeItem
                    mesh={dataset}
                    datasetIndex={i}
                    onDelete={handleDeleteDataset}
                    onUpdate={handleUpdateDataset}
                    onDuplicate={handleDuplicateDataset}
                    key={"mesh-tree-item-" + dataset.id}
                  />
                );
              }
            })}
          </TreeItem>
          <TreeItem
            title="GIS Data"
            icon={<Icon src={GenericFolder} altText="Folder" />}
            uniqueId={project.id}
            actions={[
              <CollectionVisibilityAction 
                inline
                key="gis-visibility"
                onClick={(evt, on) => {
                  setVisibilityAll(filteredDatasets[ProjectConstants.DATASET_GROUPS.GIS], on);
                }}
                disabled={!filteredDatasets[ProjectConstants.DATASET_GROUPS.GIS].length}
                off={
                  filteredDatasets[ProjectConstants.DATASET_GROUPS.GIS].every(
                    (dataset) => {
                      if (visibleObjects?.[projectId] !== undefined) {
                        return !visibleObjects?.[projectId].includes(dataset.id);
                      }
                      return true;
                    }
                  )
                }
              />,
              <AddAction 
                title="Add GIS"
                key="gis-add"
                onClick={openAddGIS}
                inline
              />,
            ]}
          >
            {filteredDatasets[ProjectConstants.DATASET_GROUPS.GIS].map((dataset, i) => {
              if (dataset.attributes?.compound !== null && dataset.attributes?.compound === true) {
                return (
                  <TreeItem
                    key={dataset.name}
                    title={ProjectConstants.DATASET_TYPE_TO_NORMALIZED_STRING[dataset.dataset_type]}
                    icon={<Icon src={Polygons} altText="Compound Dataset" />}
                  >
                    {dataset.files.map((gis, j) => (
                      <GISTreeItem
                        gis={gis}
                        datasetIndex={i}
                        deletable={false}
                        duplicatable={false}
                        renameable={false}
                        key={"gis-compound-tree-item-" + j}
                      />
                    ))}
                  </TreeItem>
                );
              } else {
                return (
                  <GISTreeItem
                    gis={dataset}
                    datasetIndex={i}
                    onDelete={handleDeleteDataset}
                    onUpdate={handleUpdateDataset}
                    onDuplicate={handleDuplicateDataset}
                    key={"gis-tree-item-" + dataset.id}
                  />
                );
              }
            })}
          </TreeItem>
          <TreeItem
            title="Raster Data"
            icon={<Icon src={GenericFolder} altText="Folder" />}
            uniqueId={project.id}
            actions={[
              <CollectionVisibilityAction 
                inline
                key="raster-visibility"
                onClick={(evt, on) => {
                  setVisibilityAll(filteredDatasets[ProjectConstants.DATASET_GROUPS.RASTER], on);
                }}
                disabled={!filteredDatasets[ProjectConstants.DATASET_GROUPS.RASTER].length}
                off={
                  filteredDatasets[ProjectConstants.DATASET_GROUPS.RASTER].every(
                    (dataset) => {
                      // Ensures that visibleObjects is actually defined before checking through it.
                      // visibleObjects isn't loaded with all of the datasets on mount.
                      // After the first project render it is updated to include all the necessary data.
                      if (visibleObjects?.[projectId] === undefined) {
                        return true;
                      }
                      // Checks if the dataset has any layers i.e. Compound Datasets
                      // If not, then it just checks the overarching dataset id
                      if (dataset?.viz?.layer === undefined || !Array.isArray(dataset?.viz?.layer)) {
                        return !visibleObjects?.[projectId].includes(dataset.id);
                      }
                      // It will then check if every single layer isn't in the visibleObjects
                      // If any layers are in the visibleObjects, then 
                      return dataset?.viz?.layer.every((layer) => {
                        if (visibleObjects?.[projectId] !== undefined) {
                          return !visibleObjects?.[projectId].includes(layer);
                        }
                        return true;
                      })
                    }
                  )
                }
              />,
              <AddAction 
                title="Add Raster"
                key="raster-add"
                onClick={openAddRaster}
                inline
              />,
            ]}
          >
            {filteredDatasets[ProjectConstants.DATASET_GROUPS.RASTER].map((dataset, i) => {
              if (ProjectConstants.DATASET_TYPE_GROUPED_FOLDERS.includes(dataset.dataset_type) ) {
                return (
                  <CompoundRasterTreeItem
                    raster={dataset}
                    datasetIndex={i}
                    onDelete={handleDeleteDataset}
                    onUpdate={handleUpdateDataset}
                    onDuplicate={handleDuplicateDataset}
                    key={`raster-compound-tree-item-${dataset.id}-${i}`}
                  />
                );
              } else {
                return (
                  <RasterTreeItem
                    raster={dataset}
                    datasetIndex={i}
                    onDelete={handleDeleteDataset}
                    onUpdate={handleUpdateDataset}
                    onDuplicate={handleDuplicateDataset}
                    key={`raster-tree-item-${dataset.id}`}
                  />
                );
              }
            })}
          </TreeItem>
          <TreeItem
            title="Tabular Data"
            icon={<Icon src={GenericFolder} altText="Folder" />}
            uniqueId={project.id}
            actions={[
              <AddAction 
                title="Add Tabular"
                key="tabular-add"
                onClick={openAddTabular}
                inline
              />,
            ]}
          >
            {filteredDatasets[ProjectConstants.DATASET_GROUPS.TABULAR].map((dataset, i) => {
              if (dataset.attributes?.compound !== null && dataset.attributes?.compound === true) {
                return (
                  <TreeItem
                    key={dataset.name}
                    title={ProjectConstants.DATASET_TYPE_TO_NORMALIZED_STRING[dataset.dataset_type]}
                    icon={<Icon src={Scalar_Dataset} altText="Compound Dataset" />}
                  >
                    {dataset.files.map((tabular, j) => (
                      <TabularTreeItem
                        tabular={tabular}
                        deletable={false}
                        duplicatable={false}
                        renameable={false}
                        key={"tabular-compound-tree-item-" + j}
                      />
                    ))}
                  </TreeItem>
                );
              } else {
                return (
                  <TabularTreeItem
                    tabular={dataset}
                    onDelete={handleDeleteDataset}
                    onUpdate={handleUpdateDataset}
                    onDuplicate={handleDuplicateDataset}
                    key={"tabular-tree-item-" + dataset.id}
                  />
                );
              }
            })}
          </TreeItem>
          <TreeItem
            title="Scenario Data"
            icon={<Icon src={GenericFolder} altText="Scenario Data"/>}
            uniqueId={project.id}
            actions={[
              <AddAction
                title="Add Scenario"
                key="scenario-add"
                onClick={openAddScenario}
                inline
              />,
            ]}
          >
            {scenarioData.map((scenario, i) => {
              return (
                <ScenarioTreeItem
                  scenario={scenario}
                  onDelete={handleDeleteScenario}
                  onDuplicate={handleDuplicateScenario}
                  onUpdate={handleUpdateScenario}
                  openModelControl={openModelControl}
                  setScenarioIndex={updateScenarioIndex}
                  scenarioIndex={i}
                  key={"scenario-tree-item-" + scenario.id}
                />
              )
            })}
          </TreeItem>
          <TreeItem
            title="Realization Data"
            icon={<Icon src={GenericFolder} altText="Realization Data" />}
            uniqueId={project.id}
            actions={[
              <CollectionVisibilityAction
                inline
                key="realization-visibility"
                onClick={(evt, on) => {
                  setVisibilityAll(realizationData.flatMap((realization) => realization?.linked_datasets), on);
                }}
                disabled={realizationData.every(
                  (realization) => realization?.linked_datasets.length === 0
                )}
                off={realizationData.every(
                  (realization, i) => realization?.linked_datasets.every(
                    (dataset) => {
                      if (visibleObjects?.[projectId] !== undefined) {
                        return !visibleObjects?.[projectId].includes(dataset.id);
                      }
                      return true;
                    }
                  )
                )}
              />,
            ]}
          >
            {realizationData.map((realization, i) => (
              <RealizationTreeItem
                key={"realization-tree-item-" + realization.id}
                realization={realization}
                onUpdate={handleUpdateRealization}
                onDelete={handleDeleteRealization}
                onDeleteDataset={handleDeleteDataset}
                onUpdateDataset={handleUpdateDataset}
                outputDatasets={filteredDatasets[ProjectConstants.DATASET_GROUPS.OTHER]} // Pass in Output data to compare
                openModelControl={openRealizationModelControl}
                setRealizationIndex={updateRealizationIndex}
                realizationIndex={i}
              />
            ))}
          </TreeItem>
        </TreeItem>
      </Panel>
      <AddMeshModal
        show={showAddMesh}
        onClose={closeAddMesh}
        onSubmit={handleAddDatasetSubmit}
      />
      <AddGISModal
        show={showAddGIS}
        onClose={closeAddGIS}
        onSubmit={handleAddDatasetSubmit}
      />
      <AddRasterModal
        show={showAddRaster}
        onClose={closeAddRaster}
        onSubmit={handleAddDatasetSubmit}
      />
      <AddTabularModal
        show={showAddTabular}
        onClose={closeAddTabular}
        onSubmit={handleAddDatasetSubmit}
      />
      <AddGenericDatasetModal
        show={showAddGenericDataset}
        onClose={closeAddGenericDataset}
        onSubmit={handleAddDatasetSubmit}
      />
      <AddScenarioModal
        show={showAddScenario}
        onClose={closeAddScenario}
        onSubmit={handleAddScenarioSubmit}
      />
      <ModelControl
        show={modelControl}
        onClose={closeModelControl}
        modelScenario={scenarioData[scenarioIndex] ?? {}}
        updateScenario={handleUpdateScenarioInputFiles}
        datasets={datasets}
      />
      <ModelControl
        show={realizationModelControl}
        onClose={closeRealizationModelControl}
        modelScenario={realizationData[realizationIndex] ?? {}}
        datasets={datasets}
        readOnly={true}
      />
      <WorkflowsModal
        workflows={workflows}
        title="Workflows"
        show={workflowsModal}
        onClose={closeWorkflows}
      />
      <ReconnectingModal
        {...(disconnected ? {
          title: "Backend Disconnected",
          message: "Could not reconnect to the backend in time. Refresh the page to try again."
        } : {})}
        show={reconnecting}
      />
      {Object.entries(fileProgress).map(([fileProgressKey, individualFileProgress]) => (
        <FileUploadToastMessage
          key={fileProgressKey}
          fileProgress={individualFileProgress}
          removeFileProgress={removeFileProgress}
          updateToast={updateToast}
          setUpdateToast={setUpdateToast}
        />
      ))}
    </div>
  );
}

Project.propTypes = {
  project: PropTypes.object.isRequired,
  setProject: PropTypes.func.isRequired,
};

export default Project;
