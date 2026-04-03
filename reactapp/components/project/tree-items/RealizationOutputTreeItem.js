import { useContext, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";

import Icon from 'assets/Icon';
import TreeItem from "components/tree/TreeItem";
import { GraphicsWindowVisualsContext, ProjectContext, SidePanelContext } from "react-tethys/context";
import { datasetPropTypes } from "components/tree/propTypes";
import { ConfirmDeleteModal } from "components/dialogs/ConfirmDeleteModal";
import VisibilityPropertySlideSheet from "../panels/VisibilityPropertyPanel";
import PlotlyPanel from "../panels/PlotlyPanel";

import RunAction from "../actions/RunAction";
import PropertiesAction from "../actions/PropertiesAction";
import VisibilityAction from "components/project/actions/VisibilityAction";
import DetailsAction from "../actions/DetailsAction";
import { DATASET_VIZ_TYPES, DO_NOT_SET_LAYER, FRAME_OBJECT } from "constants/GraphicsWindowConstants";
import Polygons from 'assets/Polygons.svg';
import LegendPanel from "../panels/LegendPanel";
import LegendsAction from "../actions/LegendsAction";
import extractLayerName from "lib/extractLayerName";

const RealizationOutputTreeItem = ({ dataset, onDelete, onUpdate, realizationIndex }) => {
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
    setSelectedCZMLPoint,
  } = useContext(GraphicsWindowVisualsContext);
  const { showPanel, hideSidePanel, visibleSidePanel } = useContext(SidePanelContext);
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

  const selectedPointRef = useRef(null);
  let legendExists = false;
  if (dataset?.viz?.legend) {
    if (dataset?.viz?.legend.length > 0) {
      legendExists = true;
    }
  }

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

  const handleFrame = () => {
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

  const toggleVisibility = (event, visibility) => {
    if (!visibility) {
      hideObject(dataset.id);
      setCZMLLayer(dataset.id, DO_NOT_SET_LAYER);
      selectedPointRef.current = selectedCZMLPoint;
      setSelectedCZMLPoint(null);
      hideSidePanel(`plotly-panel-${dataset.id}`);
      hideSidePanel(`legend-panel-${dataset.id}`);
    } else {
      const layerName = extractLayerName(dataset.viz.url[0], dataset.id);
      revealObject(dataset.id);
      setCZMLLayer(dataset.id, layerName);
      setSelectedCZMLPoint(selectedPointRef.current);
      selectedPointRef.current = null;
    }
  };

  const handleShowProperties = () => {
    showPanel(`slide-panel-${dataset.id}`);
  };

  const handleShowPlotPanel = () => {
    showPanel(`plotly-panel-${dataset.id}`);
  }

  const handleShowLegend = () => {
    if (visibleSidePanel.includes(`legend-panel-${dataset.id}`)) {
      hideSidePanel(`legend-panel-${dataset.id}`)
    } else {
      showPanel(`legend-panel-${dataset.id}`);
      showPanel(`slide-panel-${dataset.id}`);
    }
  }

  const handleOpenDatasetDetails = () => {
    const details_url = TETHYS_ROOT_URL + dataset_url;
    window.open(details_url, "_blank", "noopener noreferrer");
  };

  const realizationActions = [
    <DetailsAction
      key="details"
      onClick={handleOpenDatasetDetails}
    />
  ]

  // Currently All dataset viz types require a Visibility Side Panel,
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
        key="visibility properties"
        onClick={handleShowProperties}
        title={`Visible: ${visibleCZMLObject[dataset.id]}`}
        disabled={visibleCZMLObject[dataset.id] === DO_NOT_SET_LAYER || !visible}
      />,
    ])
  }

  if (legendExists) {
    realizationActions.push(...[
      <LegendsAction
        key="legends"
        onClick={handleShowLegend}
        title={
          `${visibleSidePanel.includes(`legend-panel-${dataset.id}`) ? "Close" : "Open"} Legend for ${visibleCZMLObject[dataset.id]}`
        }
        disabled={visibleCZMLObject[dataset.id] === DO_NOT_SET_LAYER || !visible}
      />,
    ]);
  }

  // Currently only czml datasets need this Plot Panel Action
  if (dataset?.viz?.type === DATASET_VIZ_TYPES.CZML) {
    realizationActions.push(
      <RunAction
        key={"plot panel"}
        onClick={handleShowPlotPanel}
        title={selectedCZMLPoint ? "Show Plot Panel" : "Select a Point"}
        disabled={!selectedCZMLPoint}
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
          <VisibilityPropertySlideSheet
            dataset={dataset}
            panelId={`slide-panel-${dataset.id}`}
          />
          <PlotlyPanel
            dataset={dataset}
            panelId={`plotly-panel-${dataset.id}`}
            style={{ height: "800px" }}
            realizationIndex={realizationIndex}
          />
        </>
      )}
      {legendExists && (
        <>
          <LegendPanel
            dataset={dataset}
            panelId={`legend-panel-${dataset.id}`}
            uniqueId={visibleCZMLObject[dataset.id]}
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
};

export default RealizationOutputTreeItem;
