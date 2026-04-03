import PropTypes from "prop-types";
import { useContext, useEffect, useState } from "react";
import Icon from 'assets/Icon';
import Materials_Display_Options from 'assets/Materials_Display_Options.svg';
import TreeItem from "components/tree/TreeItem";
import CollectionVisibilityAction from "../actions/CollectionVisibilityAction";
import { datasetPropTypes } from "components/tree/propTypes";
import { GraphicsWindowVisualsContext, ProjectContext } from "react-tethys/context";
import LayerRasterTreeItem from "./LayerRasterTreeItem";
import { FRAME_OBJECT } from "constants/GraphicsWindowConstants";
import DetailsAction from "../actions/DetailsAction";
import { ConfirmDeleteModal } from "components/dialogs/ConfirmDeleteModal";

const CompoundRasterTreeItem = ({
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
  const [visible, setVisible] = useState(
    visibleObjects?.[projectId]
      ? !visibleObjects?.[projectId].includes(raster.id)
      : false
  );
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    // visibleObjects context gets updated in the initial render.
    // This is after the useState default state is defined.
    // To avoid this, we will skip the first render on this component for checking the visibleObjects.
    // In that first render, we will update visibleObjects to include every dataset except the first.
    if (isFirstProjectRender) {
      // Do Nothing
    } else if (visibleObjects[projectId] !== undefined) {
      if (!visibleObjects[projectId].includes(raster.id)) {
        // TODO Add test in Project for changing visibility of a collection.
        setVisible(false);
      } else {
        setVisible(true);
      }
    }
  }, [
    visibleObjects,
    isFirstProjectRender,
    raster.id,
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
      if (raster?.viz?.layer) {
        if (raster.viz.layer.length > 0) {
          raster.viz.layer.forEach(layer => revealObject(layer));
        }
      }
    }
    setFramedObject(raster?.viz?.extent, FRAME_OBJECT);
    setZoomToExtent(FRAME_OBJECT);
  };

  const handleUpdate = (raster) => {
    onUpdate(raster);
  };

  const handleRename = (newName) => {
    const newGeometry = { ...raster, name: newName };
    handleUpdate(newGeometry);
  };

  const toggleVisibility = (collection, visibility) => {
    if (!visibility) {
      hideObject(raster.id);
      collection.forEach((layer) => hideObject(layer));
    } else {
      revealObject(raster.id);
      collection.forEach((layer) => revealObject(layer))
    }
    setVisible(visibility);
  };

  const handleOpenDatasetDetails = () => {
    const details_url = TETHYS_ROOT_URL + dataset_url;
    window.open(details_url, "_blank", "noopener noreferrer");
  };

  return (
    <TreeItem
      title={raster.name}
      icon={<Icon src={Materials_Display_Options} altText="Raster Data" width="20px" height="20px" />}
      deletable={deletable}
      duplicatable={duplicatable}
      frameable
      renameable={renameable}
      onDelete={deletable ? handleDelete : () => {}}
      onDuplicate={duplicatable ? handleDuplicate : () => {}}
      onFrame={handleFrame}
      onRename={renameable ? handleRename : () => {}}
      disabled={disabled}
      actions={[
        <CollectionVisibilityAction
          key="visibility"
          onClick={(evt, on) => toggleVisibility(raster?.viz?.layer, on)}
          inline
          off={
            // Checks if the whole dataset is visible
            // It will be off only if the dataset isn't in the visibleObjects AND
            // if every layer isn't in the visibleObjects either.
            // This allows the icon to change to open if even one of the layers is visible.
            !visible && raster?.viz?.layer.every((layer) => {
              if (visibleObjects?.[projectId] !== undefined) {
                return !visibleObjects?.[projectId].includes(layer);
              }
              return true;
            })
          }
          disabled={disabled}
        />,
        <DetailsAction
          key="details"
          onClick={handleOpenDatasetDetails}
        />,
      ]}
    >
      <ConfirmDeleteModal
        showConfirm={showConfirmDelete}
        handleDeleteCancel={handleDeleteCancel}
        handleDeleteConfirm={handleDeleteConfirm}
        message={`Are you sure you want to delete ${raster.name}?`}
      />      
      {raster?.viz?.layer.map((layer, j) => (
        <LayerRasterTreeItem
          layer={layer}
          datasetIndex={datasetIndex}
          extent={raster?.viz?.extent}
          raster={raster}
          key={"raster-compound-tree-item-" + j}
        />
      ))}
    </TreeItem>
  );
};

CompoundRasterTreeItem.propTypes = {
  raster: datasetPropTypes.isRequired,
  datasetIndex: PropTypes.number,
  onDelete: PropTypes.func,
  onDuplicate: PropTypes.func,
  onUpdate: PropTypes.func,
  deletable: PropTypes.bool,
  duplicatable: PropTypes.bool,
  renameable: PropTypes.bool,
};

export default CompoundRasterTreeItem;
