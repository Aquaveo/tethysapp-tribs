import PropTypes from "prop-types";
import { useContext, useEffect } from "react";

import { GraphicsWindowVisualsContext, SidePanelContext } from "react-tethys/context";
import SlideSheet from "components/dialogs/SlideSheet";
import { datasetPropTypes } from "components/tree/propTypes";
import TreeItem from "components/tree/TreeItem";
import { DO_NOT_SET_LAYER } from "constants/GraphicsWindowConstants";
import extractLayerName from "lib/extractLayerName";

const VisibilityPropertySlideSheet = ({ dataset, panelId }) => {
  const { hideSidePanel, visibleSidePanel } = useContext(SidePanelContext);
  const { visibleCZMLObject, setCZMLLayer } = useContext(GraphicsWindowVisualsContext);
  const handleClose = () => {
    hideSidePanel(panelId);
  }

  useEffect(() => {
    if (dataset.viz && dataset.viz.url && dataset.viz.url[0]) {
      const layerName = extractLayerName(dataset.viz.url[0], dataset.id);
      if (visibleCZMLObject[dataset.id] !== DO_NOT_SET_LAYER) {
        // This prevents czml from being set initially if the current dataset layer is null.
        setCZMLLayer(dataset.id, layerName);
      }
    }
  // This uses an empty dependency array so that it only fires on the first render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClick = (layerName) => {
    if (visibleCZMLObject[dataset.id] !== DO_NOT_SET_LAYER) {
      // This prevents czml from being set initially if the current dataset layer is null.
      setCZMLLayer(dataset.id, layerName);
    }
  }

  return (
    <SlideSheet
      title={`${dataset.name} Visibility Properties`}
      show={visibleSidePanel.includes(panelId)}
      onClose={handleClose}
      resizable
    >
      {dataset.viz.url.map((visibileLayer, i) => {
        const layerName = extractLayerName(visibileLayer, dataset.id);
        return (
          <TreeItem
            key={`visibility-panel-item-${i}`}
            title={`${layerName.replace("_[]", "")}`}
            leaf
            button
            highlightNow={visibleCZMLObject[dataset.id] === layerName}
            onClick={() => handleClick(layerName)}
            disabled={visibleCZMLObject[dataset.id] === DO_NOT_SET_LAYER}
          />
        );
      })}
    </SlideSheet>
  );
};

VisibilityPropertySlideSheet.propTypes = {
  dataset: datasetPropTypes.isRequired,
  panelId: PropTypes.string.isRequired,
};

export default VisibilityPropertySlideSheet;
