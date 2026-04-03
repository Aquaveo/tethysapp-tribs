import PropTypes from "prop-types";
import { useContext, useState, useEffect, useRef } from "react";
import Icon from "assets/Icon";
import Polygons from "assets/Polygons.svg";
import TreeItem from "components/tree/TreeItem";
import VisibilityAction from "components/project/actions/VisibilityAction";
import { datasetPropTypes } from "components/tree/propTypes";
import {
  GraphicsWindowVisualsContext,
  ProjectContext,
  SidePanelContext,
} from "react-tethys/context";
import {
  DO_NOT_SET_LAYER,
  DATASET_VIZ_TYPES,
  FRAME_OBJECT,
} from "constants/GraphicsWindowConstants";
import { ConfirmDeleteModal } from "components/dialogs/ConfirmDeleteModal";
import DetailsAction from "../actions/DetailsAction";
import LegendsAction from "../actions/LegendsAction";
import LegendPanel from "../panels/LegendPanel";
import PropertiesAction from "../actions/PropertiesAction";
import VisibilityPropertySlideSheet from "../panels/VisibilityPropertyPanel";
import extractLayerName from "lib/extractLayerName";

const GISTreeItem = ({
  gis,
  datasetIndex,
  onDelete,
  onUpdate,
  onDuplicate,
  deletable = true,
  duplicatable = true,
  renameable = true,
}) => {
  const TETHYS_ROOT_URL = process.env.TETHYS_APP_ROOT_URL;
  const dataset_url = `datasets/${gis.id}/details/summary/`;

  const { isFirstProjectRender, projectId } = useContext(ProjectContext);
  const {
    setFramedObject,
    visibleObjects,
    hideObject,
    revealObject,
    setZoomToExtent,
    visibleCZMLObject,
    setCZMLLayer,
    selectedCZMLPoint,
    setSelectedCZMLPoint,
  } = useContext(GraphicsWindowVisualsContext);
  const { showPanel, hideSidePanel, visibleSidePanel } = useContext(SidePanelContext);

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [visible, setVisible] = useState(
    visibleObjects?.[projectId]
      ? !visibleObjects?.[projectId].includes(gis.id)
      : false
  );
  const [disabled, setDisabled] = useState(false);
  const selectedPointRef = useRef(null);

  useEffect(() => {
    // visibleObjects context gets updated in the initial render.
    // This is after the useState default state is defined.
    // To avoid this, we will skip the first render on this component for checking the visibleObjects.
    // In that first render, we will update visibleObjects to include every dataset except the first.
    if (isFirstProjectRender) {
      // Do Nothing
    } else if (visibleObjects[projectId] !== undefined) {
      if (!visibleObjects[projectId].includes(gis.id)) {
        // TODO Add test in Project for changing visibility of a collection.
        setVisible(false);
      } else {
        setVisible(true);
      }
    }
  }, [
    visibleObjects,
    isFirstProjectRender,
    gis.id,
    datasetIndex,
    hideObject,
    projectId,
  ]);

  useEffect(() => {
    if (disabled) {
      // This is as a backup if a dataset can't be deleted
      // For example if a dataset is used in a Scenario or Realization.
      const timer = setTimeout(() => {
        setDisabled(false);
      }, 3000); // Is 3 seconds a good amount of time?

      // Cleanup the timer when the component unmounts or disabled changes
      return () => clearTimeout(timer);
    }
  }, [disabled]);

  let legendExists = false;
  if (gis?.viz?.legend) {
    if (gis?.viz?.legend.length > 0) {
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
    onDelete(gis.id);
    setShowConfirmDelete(false);
    setDisabled(true);
  };

  const handleDuplicate = () => {
    onDuplicate(gis.id);
  };

  const handleFrame = () => {
    if (!visibleObjects[projectId].includes(gis.id)) {
      revealObject(gis.id);
    }
    setFramedObject(gis.viz.extent, FRAME_OBJECT);
    setZoomToExtent(FRAME_OBJECT);
  };

  const handleUpdate = (gis) => {
    onUpdate(gis);
  };

  const handleRename = (newName) => {
    const newGeometry = { ...gis, name: newName };
    handleUpdate(newGeometry);
  };

  const toggleVisibility = (event, visibility) => {
    if (!visibility) {
      hideObject(gis.id);
      if (gis?.viz?.type === DATASET_VIZ_TYPES.CZML) {
        setCZMLLayer(gis.id, DO_NOT_SET_LAYER);
        selectedPointRef.current = selectedCZMLPoint;
        setSelectedCZMLPoint(null);
        hideSidePanel(`plotly-panel-${gis.id}`);
      }
    } else {
      revealObject(gis.id);
      if (gis?.viz?.type === DATASET_VIZ_TYPES.CZML) {
        const layerName = extractLayerName(gis.viz.url[0], gis.id);
        setCZMLLayer(gis.id, layerName);
        setSelectedCZMLPoint(selectedPointRef.current);
        selectedPointRef.current = null;
      }
    }
  };

  const handleShowProperties = () => {
    showPanel(`slide-panel-${gis.id}`);
  };

  const handleOpenDatasetDetails = () => {
    const details_url = TETHYS_ROOT_URL + dataset_url;
    window.open(details_url, "_blank", "noopener noreferrer");
  };

  const handleShowLegend = () => {
    if (visibleSidePanel.includes(`legend-panel-${gis.id}`)) {
      hideSidePanel(`legend-panel-${gis.id}`)
    } else {
      showPanel(`legend-panel-${gis.id}`);
    }
  };

  const gisActions = [
    <DetailsAction key="details" onClick={handleOpenDatasetDetails} />,
  ];

  if (gis?.viz) {
    gisActions.push(...[
      <VisibilityAction
        key="visibility"
        onClick={toggleVisibility}
        inline
        off={!visible}
        disabled={disabled}
      />,
    ])
  }

  if (gis?.viz?.type === DATASET_VIZ_TYPES.CZML) {
    gisActions.push(...[
      <PropertiesAction
        key="visibility properties"
        onClick={handleShowProperties}
        title={`Visible: ${visibleCZMLObject[gis.id]}`}
        disabled={visibleCZMLObject[gis.id] === DO_NOT_SET_LAYER}
      />,
    ])
  }

  if (legendExists) {
    gisActions.push(...[
      <LegendsAction
        key="legends"
        onClick={handleShowLegend}
        title={`${visibleSidePanel.includes(`legend-panel-${gis.id}`) ? "Close" : "Open"} Legend`}
        disabled={!visible}
      />,
    ]);
  }

  return (
    <>
      <TreeItem
        title={gis.name}
        icon={
          <Icon src={Polygons} altText="GIS Data" width="20px" height="20px" />
        }
        leaf
        deletable={deletable}
        duplicatable={duplicatable}
        frameable
        renameable={renameable}
        onDelete={deletable ? handleDelete : () => {}}
        onDuplicate={duplicatable ? handleDuplicate : () => {}}
        onFrame={handleFrame}
        onRename={renameable ? handleRename : () => {}}
        disabled={disabled}
        actions={gisActions}
      />
      <ConfirmDeleteModal
        showConfirm={showConfirmDelete}
        handleDeleteCancel={handleDeleteCancel}
        handleDeleteConfirm={handleDeleteConfirm}
        message={`Are you sure you want to delete ${gis.name}?`}
      />
      {legendExists && (
        <LegendPanel
          dataset={gis}
          panelId={`legend-panel-${gis.id}`}
          uniqueId={gis.id}
        />
      )}
      {gis?.viz?.type === DATASET_VIZ_TYPES.CZML && (
        <VisibilityPropertySlideSheet
          dataset={gis}
          panelId={`slide-panel-${gis.id}`}
        />
      )}
    </>
  );
};

GISTreeItem.propTypes = {
  gis: datasetPropTypes.isRequired,
  datasetIndex: PropTypes.number,
  onDelete: PropTypes.func,
  onDuplicate: PropTypes.func,
  onUpdate: PropTypes.func,
  deletable: PropTypes.bool,
  duplicatable: PropTypes.bool,
  renameable: PropTypes.bool,
};

export default GISTreeItem;
