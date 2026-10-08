import PropTypes from "prop-types";
import { useContext, useEffect } from "react";

import { GraphicsWindowVisualsContext, SidePanelContext } from "react-tethys/context";
import SlideSheet from "components/dialogs/SlideSheet";
import { datasetPropTypes } from "components/tree/propTypes";
import TreeItem from "components/tree/TreeItem";
import { DO_NOT_SET_LAYER } from "constants/GraphicsWindowConstants";
import extractLayerName from "lib/extractLayerName";
import { getVariables, isTimeDynamic, makeActiveTimeSeries } from "lib/meshTimeSeries";

/**
 * The selectable layers of a dataset: one per variable for glTF mesh output that carries viz.variables (each
 * variable spans all of its time steps), otherwise one per viz url (e.g. CZML).
 */
export function getLayerItems(dataset) {
  const variables = getVariables(dataset);
  if (variables) {
    return variables.map((variable) => ({ key: variable.name, label: variable.name, variable }));
  }
  return (dataset?.viz?.url ?? []).map((url) => {
    const layerName = extractLayerName(url, dataset.id);
    return { key: layerName, label: layerName.replace("_[]", ""), variable: null };
  });
}

const VisibilityPropertySlideSheet = ({ dataset, panelId }) => {
  const { hideSidePanel, visibleSidePanel } = useContext(SidePanelContext);
  const { visibleCZMLObject, setCZMLLayer, setActiveTimeSeries } = useContext(GraphicsWindowVisualsContext);
  const handleClose = () => {
    hideSidePanel(panelId);
  }

  const items = getLayerItems(dataset);

  const selectLayer = (item) => {
    if (!item || visibleCZMLObject[dataset.id] === DO_NOT_SET_LAYER) {
      // This prevents czml from being set initially if the current dataset layer is null.
      return;
    }
    setCZMLLayer(dataset.id, item.key);
    if (item.variable && isTimeDynamic(item.variable)) {
      // The most recently selected time-dynamic variable drives the Cesium clock.
      setActiveTimeSeries?.(makeActiveTimeSeries(dataset, item.variable));
    }
  };

  useEffect(() => {
    selectLayer(items[0]);
  // This uses an empty dependency array so that it only fires on the first render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SlideSheet
      title={`${dataset.name} Visibility Properties`}
      show={visibleSidePanel.includes(panelId)}
      onClose={handleClose}
      resizable
    >
      {items.map((item) => (
        <TreeItem
          key={`visibility-panel-item-${item.key}`}
          title={item.label}
          leaf
          button
          highlightNow={visibleCZMLObject[dataset.id] === item.key}
          onClick={() => selectLayer(item)}
          disabled={visibleCZMLObject[dataset.id] === DO_NOT_SET_LAYER}
        />
      ))}
    </SlideSheet>
  );
};

VisibilityPropertySlideSheet.propTypes = {
  dataset: datasetPropTypes.isRequired,
  panelId: PropTypes.string.isRequired,
};

export default VisibilityPropertySlideSheet;
