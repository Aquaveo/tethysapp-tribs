import PropTypes from "prop-types";
import { useContext, useEffect, useState } from "react";
import Icon from 'assets/Icon';
import TIN_Module_Icon from 'assets/TIN_Module_Icon.svg';
import TreeItem from "components/tree/TreeItem";
import VisibilityAction from "components/project/actions/VisibilityAction";
import TINTreeItem from "./TINTreeItem";
import { meshDatasetPropTypes } from "components/tree/propTypes";
import { GraphicsWindowVisualsContext, ProjectContext, SidePanelContext } from "react-tethys/context";
import { FRAME_OBJECT } from "constants/GraphicsWindowConstants";
import { ConfirmDeleteModal } from "components/dialogs/ConfirmDeleteModal";
import DetailsAction from "../actions/DetailsAction";
import LegendsAction from "../actions/LegendsAction";
import LegendPanel from "../panels/LegendPanel";

const MeshTreeItem = ({
  mesh,
  datasetIndex,
  onDelete,
  onUpdate,
  onDuplicate,
  deletable=true,
  duplicatable=true,
  renameable=true,
}) => {
  const TETHYS_ROOT_URL = process.env.TETHYS_APP_ROOT_URL;
  const dataset_url = `datasets/${mesh.id}/details/summary/`;

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
  const [visible, setVisible] = useState(visibleObjects?.[projectId] ? !visibleObjects?.[projectId].includes(mesh.id) : false);
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    // visibleObjects context gets updated in the initial render.
    // This is after the useState default state is defined.
    // To avoid this, we will skip the first render on this component for checking the visibleObjects.
    // In that first render, we will update visibleObjects to include every dataset except the first.
    if (isFirstProjectRender) {
      // Do Nothing
    } else if (visibleObjects[projectId] !== undefined) {
      if (!visibleObjects[projectId].includes(mesh.id)) {
        // TODO Add test in Project for changing visibility of a collection.
        setVisible(false);
      } else {
        setVisible(true);
      }
    }
  }, [visibleObjects, isFirstProjectRender, mesh.id, datasetIndex, hideObject, projectId]);

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
  if (mesh?.viz?.legend) {
    if (mesh?.viz?.legend.length > 0) {
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
    onDelete(mesh.id);
    setShowConfirmDelete(false);
    setDisabled(true);
  };

  const handleDuplicate = () => {
    onDuplicate(mesh.id);
  };

  const handleFrame = () => {
    if (!visibleObjects[projectId].includes(mesh.id)) {
      revealObject(mesh.id);
    }
    setFramedObject(mesh.viz.extent, FRAME_OBJECT);
    setZoomToExtent(FRAME_OBJECT);
  };

  const handleUpdate = (mesh) => {
    onUpdate(mesh);
  };

  const handleRename = (newName) => {
    const newGeometry = { ...mesh, name: newName };
    handleUpdate(newGeometry);
  };

  const toggleVisibility = (event, visibility) => {
    if (!visibility) {
      hideObject(mesh.id)
      hideSidePanel(`legend-panel-${mesh.id}`)
    } else {
      revealObject(mesh.id)
    }
    setVisible(visibility);
  };

  const handleOpenDatasetDetails = () => {
    const details_url = TETHYS_ROOT_URL + dataset_url;
    window.open(details_url, "_blank", "noopener noreferrer");
  };

  const handleShowLegend = () => {
    if (visibleSidePanel.includes(`legend-panel-${mesh.id}`)) {
      hideSidePanel(`legend-panel-${mesh.id}`)
    } else {
      showPanel(`legend-panel-${mesh.id}`);
    }
  };

  const meshActions = [
    <DetailsAction
      key="details"
      onClick={handleOpenDatasetDetails}
    />
  ];

  if (mesh?.viz) {
    meshActions.push(...[
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
    meshActions.push(...[
      <LegendsAction
        key="legends"
        onClick={handleShowLegend}
        title={`${visibleSidePanel.includes(`legend-panel-${mesh.id}`) ? "Close" : "Open"} Legend`}
        disabled={!visible}
      />,
    ]);
  }

  return (
    <>
      <TreeItem
        title={mesh.name}
        uniqueId={mesh.id}
        icon={<Icon src={TIN_Module_Icon} altText="Mesh Data"/>}
        deletable={deletable}
        duplicatable={duplicatable}
        leaf
        frameable
        renameable={renameable}
        onDelete={deletable ? handleDelete : () => {}}
        onDuplicate={duplicatable ? handleDuplicate : () => {}}
        onFrame={handleFrame}
        onRename={renameable ? handleRename : () => {}}
        disabled={disabled}
        actions={meshActions}
      >
        {mesh.datasets.map((dataset, i) => (
          <TINTreeItem
            dataset={dataset}
            datasetIndex={datasetIndex}
            disabled={disabled}
            key={"data-set-" + i}
          />
        ))}
      </TreeItem>
      <ConfirmDeleteModal
        showConfirm={showConfirmDelete}
        handleDeleteCancel={handleDeleteCancel}
        handleDeleteConfirm={handleDeleteConfirm}
        message={`Are you sure you want to delete ${mesh.name}?`}
      />
      {legendExists && (
        <LegendPanel
          dataset={mesh}
          panelId={`legend-panel-${mesh.id}`}
          uniqueId={mesh.id}
        />
      )}
    </>
  );
};

MeshTreeItem.propTypes = {
  mesh: meshDatasetPropTypes,
  datasetIndex: PropTypes.number,
  onDelete: PropTypes.func,
  onDuplicate: PropTypes.func,
  onUpdate: PropTypes.func,
  deletable: PropTypes.bool,
  duplicatable: PropTypes.bool,
  renameable: PropTypes.bool,
};

export default MeshTreeItem;
