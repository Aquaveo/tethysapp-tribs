// Helpers for layers the browser colors by value: node dynamic output and outlet hydrographs (points) and basin
// averaged output (the basin polygon).
//
// The backend (tribs_adapter write_value_layer) writes one CZML document with the features of the dataset and, for
// each variable, a values file whose url is in `viz.variables[].values`:
//   { variable, start, hours: [...], ids: [...], values: [[...], ...] }
// `values[i][j]` is the value of feature `ids[i]` at `hours[j]` (hours since `start`, the start of the run), in
// display units; null means no value. A feature shows the row of the last hour at or before the clock time.
//
// Nothing in here depends on Cesium or React.
import { isoToUtcMs, isValueVariable } from "lib/meshTimeSeries";

const MS_PER_HOUR = 60 * 60 * 1000;
// Row times are compared with this slack so rounding in the clock time never shows the row before.
const HOUR_TOLERANCE = 1e-6;

/** Whether a dataset is a value layer: CZML whose variables name a values file. */
export function hasValues(dataset) {
  if (dataset?.viz?.type !== "czml") return false;
  const variables = dataset.viz.variables;
  return Array.isArray(variables) && variables.some(isValueVariable);
}

/** The value variable of a dataset with the given layer name, or null. */
export function findValueVariable(dataset, name) {
  if (!hasValues(dataset)) return null;
  return dataset.viz.variables.find((variable) => variable.name === name && isValueVariable(variable)) ?? null;
}

const cache = new Map();

/**
 * The parsed values file at a url. Files are fetched once and shared by everything that shows the layer (the map
 * and its legend); a failed fetch is dropped from the cache so it can be tried again.
 */
export function fetchValues(url, fetcher = (target) => fetch(target)) {
  if (!cache.has(url)) {
    const request = Promise.resolve()
      .then(() => fetcher(url))
      .then((response) => {
        if (!response.ok) throw new Error(`Could not load layer values (${response.status}): ${url}`);
        return response.json();
      })
      .catch((error) => {
        cache.delete(url);
        throw error;
      });
    cache.set(url, request);
  }
  return cache.get(url);
}

/** Forget every fetched values file (for tests). */
export function clearValuesCache() {
  cache.clear();
}

/**
 * Index of the row a values file shows at a time: the last row at or before it, the first row before the first
 * hour, and the first row when the file or the time has no date.
 *
 * @param values  A parsed values file.
 * @param time    Milliseconds since the epoch, an ISO string or a Date; null/undefined selects the first row.
 */
export function rowIndexForTime(values, time) {
  const hours = values?.hours ?? [];
  const t = isoToUtcMs(time);
  const startMs = isoToUtcMs(values?.start);
  if (hours.length < 2 || t === null || startMs === null) return 0;
  const hour = (t - startMs) / MS_PER_HOUR + HOUR_TOLERANCE;
  let low = 0;
  let high = hours.length - 1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (hours[middle] <= hour) low = middle;
    else high = middle - 1;
  }
  return low;
}

/** ISO time of a row of a values file ("2004-06-01T10:00:00Z"), or null when the file has no date. */
export function rowTime(values, index) {
  const startMs = isoToUtcMs(values?.start);
  const hour = values?.hours?.[index];
  if (startMs === null || hour === null || hour === undefined) return null;
  return new Date(Math.round(startMs + hour * MS_PER_HOUR)).toISOString().replace(/\.\d{3}Z$/, "Z");
}

/**
 * Where a value sits between a variable's minimum (0) and maximum (1), clamped; null for a missing value. A
 * variable with a single value (or no range) sits at the low end, as its legend labels it min..min + 1.
 */
export function normalize(value, min, max) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return 0;
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}
