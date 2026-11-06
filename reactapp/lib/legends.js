// Helpers for the global Legends panel: which datasets have a legend, and how the registered legend entries
// are ordered. Entries are registered by the project tree items (see hooks/useLegendEntry.js) and rendered by
// components/project/panels/LegendsPanel.js.
import { getVariables } from "lib/meshTimeSeries";

// Mirrors the folder order of the project tree in views/project/Project.js. Tabular and scenario data have no
// legends.
export const LEGEND_GROUPS = { MESH: 0, GIS: 1, RASTER: 2, REALIZATION: 3 };

/** Whether a dataset has anything to show in a legend: legend images, or glTF time steps drawn with a legend. */
export function hasLegend(dataset) {
  if (dataset?.viz?.legend?.length > 0) return true;
  return Boolean(getVariables(dataset)?.some((variable) => variable.timesteps?.some((timestep) => timestep.legend)));
}

/**
 * Sort registered legend entries into project-tree order: lexicographically on their `order` sort key
 * ([group, dataset index, sub index]), then by registration sequence for entries with the same key.
 */
export function compareLegends(a, b) {
  const orderA = a.order ?? [];
  const orderB = b.order ?? [];
  const length = Math.max(orderA.length, orderB.length);
  for (let i = 0; i < length; i++) {
    const diff = (orderA[i] ?? 0) - (orderB[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return (a.seq ?? 0) - (b.seq ?? 0);
}

function sameValue(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
  }
  return Object.is(a, b);
}

/** Shallow comparison of two legend entries (arrays compared element-wise), so re-registering unchanged props is a no-op. */
export function sameLegendEntry(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (!sameValue(a[key], b[key])) return false;
  }
  return true;
}
