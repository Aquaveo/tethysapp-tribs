import { useCallback, useContext, useEffect, useRef } from "react";

import { LegendsRegistryContext } from "react-tethys/context";

/**
 * Registers a layer's legend with the global Legends panel while `active` is true (the layer is visible and has a
 * legend), and removes it when `active` turns false or the tree item unmounts.
 *
 * The tree item that renders the layer calls this with the same props it would give a legend: the dataset, the
 * layer/variable name (`uniqueId`), the legend image urls and time step of the current glTF time step, the
 * variable (label, units, range) and the realization name. `order` is the entry's sort key in project-tree
 * order (see lib/legends.js). `onColorRampChange` is kept in a ref so a new callback identity never re-registers.
 */
export default function useLegendEntry({
  id,
  active,
  order,
  dataset,
  uniqueId,
  legendUrls,
  subtitle,
  variable,
  realizationName,
  onColorRampChange,
}) {
  const { registerLegend, unregisterLegend } = useContext(LegendsRegistryContext);
  const rampCallbackRef = useRef(onColorRampChange);
  rampCallbackRef.current = onColorRampChange;
  const forwardRampChange = useCallback((rampName) => rampCallbackRef.current?.(rampName), []);

  // Arrays are compared by content: a tree item builds a fresh array on every render.
  const orderKey = JSON.stringify(order ?? []);
  const legendUrlsKey = legendUrls ? JSON.stringify(legendUrls) : null;

  // Register (or refresh) the entry whenever its content changes. No cleanup here: the registry replaces the
  // entry in place, so it keeps its place in the order and skips re-registrations that change nothing.
  useEffect(() => {
    if (!active) {
      return;
    }
    registerLegend(id, {
      id,
      order: JSON.parse(orderKey),
      dataset,
      uniqueId,
      legendUrls: legendUrlsKey === null ? undefined : JSON.parse(legendUrlsKey),
      subtitle,
      variable,
      realizationName,
      onColorRampChange: forwardRampChange,
    });
  }, [
    id,
    active,
    orderKey,
    dataset,
    uniqueId,
    legendUrlsKey,
    subtitle,
    variable,
    realizationName,
    forwardRampChange,
    registerLegend,
  ]);

  // Remove the entry when the layer is hidden, when its id changes and when the tree item unmounts.
  useEffect(() => {
    if (!active) {
      unregisterLegend(id);
      return undefined;
    }
    return () => unregisterLegend(id);
  }, [id, active, unregisterLegend]);
}
