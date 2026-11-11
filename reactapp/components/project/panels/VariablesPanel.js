import PropTypes from "prop-types";
import { useContext, useEffect } from "react";

import { GraphicsWindowVisualsContext, ProjectContext, SidePanelContext } from "react-tethys/context";
import SlideSheet from "components/dialogs/SlideSheet";
import { datasetPropTypes } from "components/tree/propTypes";
import TreeItem from "components/tree/TreeItem";
import { DATASET_VIZ_TYPES, DO_NOT_SET_LAYER } from "constants/GraphicsWindowConstants";
import { isTimeDynamic, makeActiveTimeSeries } from "lib/meshTimeSeries";
import { groupByTier, layerEntries, variableTitle } from "lib/outputVariables";

/**
 * The selectable layers of a dataset, in display order: one per `viz.variables` entry (glTF mesh output and
 * labelled CZML output; the backend lists priority variables before secondary ones), otherwise one per viz url
 * (e.g. older CZML). `key` is the raw layer name the rest of the app selects by; `label` is what is shown.
 */
export function getLayerItems(dataset) {
  const isGltf = dataset?.viz?.type === DATASET_VIZ_TYPES.GLTF;
  return layerEntries(dataset).map((entry) => ({
    key: entry.name,
    label: variableTitle(entry),
    tooltip: entry.description || variableTitle(entry),
    tier: entry.tier ?? null,
    variable: isGltf ? entry : null,
  }));
}

const VariablesPanel = ({ dataset, panelId }) => {
  const { hideSidePanel, visibleSidePanel } = useContext(SidePanelContext);
  const { visibleObjects, visibleCZMLObject, setCZMLLayer, setActiveTimeSeries } =
    useContext(GraphicsWindowVisualsContext);
  const { projectId } = useContext(ProjectContext);
  const onMap = Boolean(visibleObjects?.[projectId]?.includes(dataset.id));
  const handleClose = () => {
    hideSidePanel(panelId);
  }

  const items = getLayerItems(dataset);
  // Priority (and untiered) variables are listed up front; secondary ones wait in a collapsed group.
  const { primary, more } = groupByTier(items);
  const selectedKey = visibleCZMLObject?.[dataset.id];

  const selectLayer = (item, driveClock = true) => {
    if (!item || visibleCZMLObject[dataset.id] === DO_NOT_SET_LAYER) {
      // This prevents czml from being set initially if the current dataset layer is null.
      return;
    }
    setCZMLLayer(dataset.id, item.key);
    if (driveClock && item.variable && isTimeDynamic(item.variable)) {
      // The most recently selected time series variable drives the Cesium clock.
      setActiveTimeSeries?.(makeActiveTimeSeries(dataset, item.variable));
    }
  };

  useEffect(() => {
    // Every output dataset mounts this panel, on the map or not. A hidden dataset gets its default layer here but
    // must not take the clock from the ones that are shown; it takes it when it is revealed (see the tree item)
    // or when one of its variables is picked.
    selectLayer(primary[0] ?? items[0], onMap);
  // This uses an empty dependency array so that it only fires on the first render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderItem = (item) => (
    <TreeItem
      key={`visibility-panel-item-${item.key}`}
      title={item.label}
      tooltip={item.tooltip}
      leaf
      button
      highlightNow={selectedKey === item.key}
      onClick={() => selectLayer(item)}
      disabled={selectedKey === DO_NOT_SET_LAYER}
    />
  );

  return (
    <SlideSheet
      title={`${dataset.name} Variables`}
      show={visibleSidePanel.includes(panelId)}
      onClose={handleClose}
      resizable
    >
      {primary.map(renderItem)}
      {more.length > 0 && (
        <TreeItem
          title={`More variables (${more.length})`}
          uniqueId={dataset.id}
          defaultOpen={more.some((item) => item.key === selectedKey)}
          disabled={selectedKey === DO_NOT_SET_LAYER}
        >
          {more.map(renderItem)}
        </TreeItem>
      )}
    </SlideSheet>
  );
};

VariablesPanel.propTypes = {
  dataset: datasetPropTypes.isRequired,
  panelId: PropTypes.string.isRequired,
};

export default VariablesPanel;
