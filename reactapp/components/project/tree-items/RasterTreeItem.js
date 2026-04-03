import PropTypes from "prop-types";
import { useContext, useEffect, useState } from "react";
import Icon from 'assets/Icon';
import Materials_Display_Options from 'assets/Materials_Display_Options.svg';
import TreeItem from "components/tree/TreeItem";
import VisibilityAction from "components/project/actions/VisibilityAction";
import { datasetPropTypes } from "components/tree/propTypes";
import { GraphicsWindowVisualsContext, ProjectContext, SidePanelContext } from "react-tethys/context";
import { FRAME_OBJECT } from "constants/GraphicsWindowConstants";
import { ConfirmDeleteModal } from "components/dialogs/ConfirmDeleteModal";
import DetailsAction from "../actions/DetailsAction";
import LegendsAction from "../actions/LegendsAction";
import LegendPanel from "../panels/LegendPanel";

const RasterTreeItem = ({
  raster,
  datasetIndex,
  onDelete,
  onUpdate,
  onDuplicate,
  deletable=true,
  duplicatable=true,
  renameable=true,
}) => {
  const TETHYS_ROOT_URL = process.env.TETHYS_APP_ROOT_URL;
  const dataset_url = `datasets/${raster.id}/details/summary/`;

  const { isFirstProjectRender, projectId } = useContext(ProjectContext);
  const {
    setFramedObject,
    visibleObjects,
    hideObject,
    revealObject,
    setZoomToExtent,
  } = useContext(GraphicsWindowVisualsContext);
  const { showPanel, hideSidePanel, visibleSidePanel } = useContext(SidePanelContext);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const [visible, setVisible] = useState(visibleObjects?.[projectId] ? !visibleObjects?.[projectId].includes(raster.id) : false);
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    // visibleObjects context gets updated in the initial render.
    // This is after the useState default state is defined.
    // To avoid this, we will skip the first render on this component for checking the visibleObjects.
    // In that first render, we will update visibleObjects to include every dataset except the first.
    if (isFirstProjectRender) {
      // Do nothing
    } else if (visibleObjects[projectId] !== undefined) {
      if (!visibleObjects[projectId].includes(raster.id)) {
        // TODO Add test in Project for changing visibility of a collection.
        setVisible(false);
      } else {
        setVisible(true);
      }
    }
  }, [visibleObjects, isFirstProjectRender, raster.id, datasetIndex, hideObject, projectId]);

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
  if (raster?.viz?.legend) {
    if (raster?.viz?.legend.length > 0) {
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
    onDelete(raster.id);
    setShowConfirmDelete(false);
    setDisabled(true);
  };

  const handleDuplicate = () => {
    onDuplicate(raster.id);
  };

  const handleFrame = () => {
    if (!visibleObjects[projectId].includes(raster.id)) {
      revealObject(raster.id);
    }
    setFramedObject(raster.viz.extent, FRAME_OBJECT);
    setZoomToExtent(FRAME_OBJECT);
  };

  const handleUpdate = (raster) => {
    onUpdate(raster);
  };

  const handleRename = (newName) => {
    const newGeometry = { ...raster, name: newName };
    handleUpdate(newGeometry);
  };

  const toggleVisibility = (event, visibility) => {
    if (!visibility) {
      hideObject(raster.id)
      hideSidePanel(`legend-panel-${raster.id}`)
    } else {
      revealObject(raster.id)
    }
    setVisible(visibility);
  };

  const handleOpenDatasetDetails = () => {
    const details_url = TETHYS_ROOT_URL + dataset_url;
    window.open(details_url, "_blank", "noopener noreferrer");
  };

  const handleShowLegend = () => {
    if (visibleSidePanel.includes(`legend-panel-${raster.id}`)) {
      hideSidePanel(`legend-panel-${raster.id}`)
    } else {
      showPanel(`legend-panel-${raster.id}`);
    }
  };

  const rasterActions = [
    <DetailsAction
      key="details"
      onClick={handleOpenDatasetDetails}
    />
  ];

  if (raster?.viz) {
    rasterActions.push(...[
      <VisibilityAction
        key="visibility"
        onClick={toggleVisibility}
        inline
        off={!visible}
        disabled={disabled}
      />,
    ])
  }

  if (legendExists) {
    rasterActions.push(...[
      <LegendsAction
        key="legends"
        onClick={handleShowLegend}
        title={`${visibleSidePanel.includes(`legend-panel-${raster.id}`) ? "Close" : "Open"} Legend`}
        disabled={!visible}
      />,
    ]);
  }

  return (
    <>
      <TreeItem
        title={raster.name}
        icon={<Icon src={Materials_Display_Options} altText="Raster Data" width="20px" height="20px" />}
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
        actions={rasterActions}
      />
      <ConfirmDeleteModal
        showConfirm={showConfirmDelete}
        handleDeleteCancel={handleDeleteCancel}
        handleDeleteConfirm={handleDeleteConfirm}
        message={`Are you sure you want to delete ${raster.name}?`}
      />
      {legendExists && (
        <LegendPanel
          dataset={raster}
          panelId={`legend-panel-${raster.id}`}
          uniqueId={raster.id}
        />
      )}      
    </>
  );
};

RasterTreeItem.propTypes = {
  raster: datasetPropTypes.isRequired,
  datasetIndex: PropTypes.number,
  onDelete: PropTypes.func,
  onDuplicate: PropTypes.func,
  onUpdate: PropTypes.func,
  deletable: PropTypes.bool,
  duplicatable: PropTypes.bool,
  renameable: PropTypes.bool,
};

export default RasterTreeItem;
