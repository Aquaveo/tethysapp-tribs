import { useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";

import Icon from 'assets/Icon';
import TreeItem from "components/tree/TreeItem";
import { GraphicsWindowVisualsContext, ProjectContext, SidePanelContext } from "react-tethys/context";
import { datasetPropTypes } from "components/tree/propTypes";
import { ConfirmDeleteModal } from "components/dialogs/ConfirmDeleteModal";
import VariablesPanel from "../panels/VariablesPanel";
import PlotlyPanel from "../panels/PlotlyPanel";

import RunAction from "../actions/RunAction";
import PropertiesAction from "../actions/PropertiesAction";
import VisibilityAction from "components/project/actions/VisibilityAction";
import DetailsAction from "../actions/DetailsAction";
import DownloadAction from "../actions/DownloadAction";
import { DATASET_VIZ_TYPES, DO_NOT_SET_LAYER, FRAME_OBJECT } from "constants/GraphicsWindowConstants";
import { isSelectionOf, plotPanelId } from "constants/PlotConstants";
import Polygons from 'assets/Polygons.svg';
import extractLayerName from "lib/extractLayerName";
import { findVariable, getVariables, isTimeDynamic, makeActiveTimeSeries, timestepForTime } from "lib/meshTimeSeries";
import { describeLayer, variableTitle } from "lib/outputVariables";
import { getLayerItems } from "components/project/panels/VariablesPanel";
import { LEGEND_GROUPS, hasLegend } from "lib/legends";
import useLegendEntry from "hooks/useLegendEntry";

const RealizationOutputTreeItem = ({ dataset, onDelete, onUpdate, realizationIndex, realizationName, outputIndex }) => {
  const TETHYS_ROOT_URL = process.env.TETHYS_APP_ROOT_URL;
  const dataset_url = `datasets/${dataset.id}/details/summary/`;

  const {
    setFramedObject,
    visibleObjects,
    hideObject,
    revealObject,
    visibleCZMLObject,
    setZoomToExtent,
    setCZMLLayer,
    selectedCZMLPoint,
    activeTimeSeries,
    setActiveTimeSeries,
    meshClockTime,
  } = useContext(GraphicsWindowVisualsContext);
  const { showPanel, hideSidePanel } = useContext(SidePanelContext);
  const { isFirstProjectRender, projectId } = useContext(ProjectContext);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [visible, setVisible] = useState(visibleObjects?.[projectId] ? !visibleObjects?.[projectId].includes(dataset.id) : false);

  useEffect(() => {
    // visibleObjects context gets updated in the initial render.
    // This is after the useState default state is defined.
    // To avoid this, we will skip the first render on this component for checking the visibleObjects.
    // In that first render, we will update visibleObjects to include every dataset except the first.
    if (isFirstProjectRender) {
      // Do Nothing
    } else if (visibleObjects[projectId] !== undefined) {
      if (!visibleObjects[projectId].includes(dataset.id)) {
        // TODO Add test in Project for changing visibility of a collection.
        setVisible(false);
      } else {
        setVisible(true);
      }
    }
  }, [visibleObjects, isFirstProjectRender, dataset.id, hideObject, projectId]);

  const variables = getVariables(dataset);
  // The selected layer; glTF output is drawn with its first variable until one is picked (see GltfLayers).
  const selectedLayer = visibleCZMLObject?.[dataset.id] ?? variables?.[0]?.name;
  // glTF mesh output: the legend follows the time step of the selected variable at the current clock time
  const activeVariable = findVariable(dataset, selectedLayer);
  const currentTimestep = activeVariable ? timestepForTime(activeVariable, meshClockTime) : null;

  const handleDelete = () => {
    setShowConfirmDelete(true);
  };

  const handleDeleteCancel = () => {
    setShowConfirmDelete(false);
  };

  const handleDeleteConfirm = () => {
    onDelete(dataset.id);
    setShowConfirmDelete(false);
  };

  // Show the dataset with its first listed layer, the first priority variable when the output is tiered (and, for
  // time series mesh output, hand the Cesium clock its first variable).
  const reveal = () => {
    const layerName = getLayerItems(dataset)[0]?.key ?? extractLayerName(dataset.viz.url[0], dataset.id);
    revealObject(dataset.id);
    setCZMLLayer(dataset.id, layerName);
    if (variables && isTimeDynamic(variables[0])) {
      setActiveTimeSeries?.(makeActiveTimeSeries(dataset, variables[0]));
    }
  };

  const handleFrame = () => {
    if (!visibleObjects[projectId]?.includes(dataset.id)) {
      // Framing a hidden dataset shows it first; otherwise the camera flies to an empty extent.
      reveal();
    }
    setFramedObject(dataset.viz.extent, FRAME_OBJECT);
    setZoomToExtent(FRAME_OBJECT);
  };

  const handleUpdate = (dataset) => {
    onUpdate(dataset);
  };

  const handleRename = (newName) => {
    const newDataset = { ...dataset, name: newName };
    handleUpdate(newDataset);
  };

  // Only the chosen ramp is sent: the backend merges attributes one key at a time.
  const handleColorRampChange = (rampName) => {
    handleUpdate({ id: dataset.id, attributes: { color_ramp: rampName } });
  };

  // The legend of the selected layer is listed in the global Legends panel while the dataset is shown; for glTF
  // output it follows the time step of the selected variable at the current clock time.
  const shown = Boolean(visibleObjects?.[projectId]?.includes(dataset.id));
  useLegendEntry({
    id: dataset.id,
    active: hasLegend(dataset) && shown && Boolean(selectedLayer) && selectedLayer !== DO_NOT_SET_LAYER,
    order: [LEGEND_GROUPS.REALIZATION, realizationIndex, outputIndex ?? 0],
    dataset,
    uniqueId: selectedLayer,
    legendUrls: currentTimestep?.legend ? [currentTimestep.legend] : undefined,
    subtitle: currentTimestep?.time ?? undefined,
    variable: activeVariable ?? undefined,
    realizationName,
    onColorRampChange: handleColorRampChange,
  });

  const toggleVisibility = (event, visibility) => {
    if (!visibility) {
      hideObject(dataset.id);
      setCZMLLayer(dataset.id, DO_NOT_SET_LAYER);
      if (activeTimeSeries?.datasetId === dataset.id) {
        setActiveTimeSeries?.(null);
      }
      // The selected point stays selected (Cesium hides its marker with the layer); only the plot sheet closes.
      hideSidePanel(plotPanelId(dataset.id));
    } else {
      reveal();
    }
  };

  const handleShowProperties = () => {
    showPanel(`slide-panel-${dataset.id}`);
  };

  const handleShowPlotPanel = () => {
    showPanel(plotPanelId(dataset.id));
  }

  const handleOpenDatasetDetails = () => {
    const details_url = TETHYS_ROOT_URL + dataset_url;
    window.open(details_url, "_blank", "noopener noreferrer");
  };

  const realizationActions = [
    <DetailsAction
      key="details"
      onClick={handleOpenDatasetDetails}
    />,
    <DownloadAction
      key="download"
      datasetId={dataset.id}
    />,
  ]

  // Every dataset viz type offers the Variables panel (the layer/variable picker),
  // so the PropertiesAction is added to all datasets with a viz
  if (dataset?.viz) {
    realizationActions.push(...[
      <VisibilityAction
        key="visibility"
        onClick={toggleVisibility}
        inline
        off={!visible}
      />,
      <PropertiesAction
        key="variables"
        onClick={handleShowProperties}
        title={`Variable: ${variableTitle(describeLayer(dataset, visibleCZMLObject[dataset.id]))}`}
        disabled={visibleCZMLObject[dataset.id] === DO_NOT_SET_LAYER || !visible}
      />,
    ])
  }

  // Currently only czml datasets need this Plot Panel Action: enabled once one of this dataset's features is
  // selected on the globe (the selection id ends in "[<dataset id>]") and while the layer is shown.
  if (dataset?.viz?.type === DATASET_VIZ_TYPES.CZML) {
    const pointSelected = isSelectionOf(selectedCZMLPoint, dataset.id);
    realizationActions.push(
      <RunAction
        key={"plot panel"}
        onClick={handleShowPlotPanel}
        title={pointSelected ? "Show Plot Panel" : "Select a Point"}
        disabled={!pointSelected || !visible}
      />,
    )
  }

  return (
    <>
      <TreeItem
        title={dataset.name}
        icon={<Icon src={Polygons} altText="Realization Output Data" width="20px" height="20px" />}
        leaf
        deletable
        frameable={dataset.viz !== undefined}
        renameable
        onDelete={handleDelete}
        onFrame={handleFrame}
        onRename={handleRename}
        actions={realizationActions}
      />
      <ConfirmDeleteModal
        showConfirm={showConfirmDelete}
        handleDeleteCancel={handleDeleteCancel}
        handleDeleteConfirm={handleDeleteConfirm}
        message={`Are you sure you want to delete ${dataset.name}?`}
      />
      {dataset.viz !== undefined && (
        <>
          <VariablesPanel
            dataset={dataset}
            panelId={`slide-panel-${dataset.id}`}
          />
          <PlotlyPanel
            dataset={dataset}
            panelId={plotPanelId(dataset.id)}
            realizationIndex={realizationIndex}
          />
        </>
      )}
    </>
  );
};

RealizationOutputTreeItem.propTypes = {
  dataset: datasetPropTypes.isRequired,
  onDelete: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  realizationIndex: PropTypes.number.isRequired,
  realizationName: PropTypes.string,
  outputIndex: PropTypes.number, // position among the realization's output datasets, for legend ordering
};

export default RealizationOutputTreeItem;
