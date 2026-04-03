import PropTypes from "prop-types";
import { useContext, useEffect, useState } from "react";
import Icon from 'assets/Icon';
import Materials_Display_Options from 'assets/Materials_Display_Options.svg';
import TreeItem from "components/tree/TreeItem";
import VisibilityAction from "components/project/actions/VisibilityAction";
import { GraphicsWindowVisualsContext, ProjectContext, SidePanelContext } from "react-tethys/context";
import { FRAME_OBJECT } from "constants/GraphicsWindowConstants";
import { datasetPropTypes } from "components/tree/propTypes";
import LegendPanel from "../panels/LegendPanel";
import LegendsAction from "../actions/LegendsAction";

const LayerRasterTreeItem = ({
  layer,
  datasetIndex,
  extent,
  raster,
}) => {
  const { isFirstProjectRender, projectId } = useContext(ProjectContext);
  const {
    setFramedObject,
    visibleObjects,
    hideObject,
    revealObject,
    setZoomToExtent,
  } = useContext(GraphicsWindowVisualsContext);
  const { showPanel, hideSidePanel, visibleSidePanel } = useContext(SidePanelContext);
  const [visible, setVisible] = useState(visibleObjects?.[projectId] ? !visibleObjects?.[projectId].includes(layer) : false);

  useEffect(() => {
    // visibleObjects context gets updated in the initial render.
    // This is after the useState default state is defined.
    // To avoid this, we will skip the first render on this component for checking the visibleObjects.
    // In that first render, we will update visibleObjects to include every dataset except the first.
    if (isFirstProjectRender) {
      // Do Nothing
    } else if (visibleObjects[projectId] !== undefined) {
      if (!visibleObjects[projectId].includes(layer)) {
        // TODO Add test in Project for changing visibility of a collection.
        setVisible(false);
      } else {
        setVisible(true);
      }
    }
  }, [
    visibleObjects,
    isFirstProjectRender,
    layer,
    datasetIndex,
    hideObject,
    projectId,
    raster.id,
  ]);

  let legendExists = false;
  if (raster?.viz?.legend) {
    if (raster?.viz?.legend.length > 0) {
      legendExists = true;
    }
  }

  const handleFrame = () => {
    if (!visibleObjects[projectId].includes(layer)) {
      revealObject(layer);
    }
    setFramedObject(extent, FRAME_OBJECT);
    setZoomToExtent(FRAME_OBJECT)
  };

  const toggleVisibility = (event, visibility) => {
    if (!visibility) {
      hideObject(layer)
    } else {
      revealObject(layer)
    }
    setVisible(visibility);
  };

  const handleShowLegend = () => {
    if (visibleSidePanel.includes(`legend-panel-${raster.id}-${layer}`)) {
      hideSidePanel(`legend-panel-${raster.id}-${layer}`)
    } else {
      showPanel(`legend-panel-${raster.id}-${layer}`);
    }
  };

  const layerActions = [
    <VisibilityAction
      key="visibility"
      onClick={toggleVisibility}
      inline
      off={!visible}
    />,
  ];

  if (legendExists) {
    layerActions.push(...[
      <LegendsAction
        key="legends"
        onClick={handleShowLegend}
        title={`${visibleSidePanel.includes(`legend-panel-${raster.id}-${layer}`) ? "Close" : "Open"} Legend`}
        disabled={!visible}
      />,
    ]);
  }

  return (
    <>
      <TreeItem
        title={layer.split('_').slice(1).join("")}
        icon={<Icon src={Materials_Display_Options} altText="Layer Data" width="20px" height="20px" />}
        leaf
        frameable
        onFrame={handleFrame}
        actions={layerActions}
      />
      {legendExists && (
        <LegendPanel
          dataset={raster}
          panelId={`legend-panel-${raster.id}-${layer}`}
          uniqueId={layer}
        />
      )}      
    </>
  );
};

LayerRasterTreeItem.propTypes = {
  layer: PropTypes.string.isRequired,
  extent: PropTypes.arrayOf(PropTypes.number), // This will be an array of 4 values, one for each corner of the boundary
  raster: datasetPropTypes.isRequired,
  datasetIndex: PropTypes.number,
  onDelete: PropTypes.func,
  onDuplicate: PropTypes.func,
  onUpdate: PropTypes.func,
  deletable: PropTypes.bool,
  duplicatable: PropTypes.bool,
  renameable: PropTypes.bool,
};

export default LayerRasterTreeItem;
