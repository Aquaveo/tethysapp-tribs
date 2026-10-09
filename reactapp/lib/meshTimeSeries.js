// Helpers for the per-variable time series of glTF mesh datasets (dataset.viz.variables).
//
// The backend emits, for each output variable, a sorted list of time steps with the glTF (and legend) file written
// for that step:
//   { name, start, end, step_hours, timesteps: [{ hours, time, url, legend }, ...] }
// Times are ISO 8601 strings in UTC. A static variable (the bare mesh colored by elevation) has a single time step
// with start/end/time of null.
//
// Nothing in here depends on Cesium so it stays unit-testable; convert to JulianDate at the edges.

// Wall-clock seconds the Cesium clock takes to play through one time step.
export const SECONDS_PER_TIMESTEP_WALL = 0.5;

const MS_PER_HOUR = 60 * 60 * 1000;

/**
 * Milliseconds since the epoch of an ISO 8601 string. Strings without a zone are treated as UTC, which is how
 * Cesium's JulianDate.fromIso8601 reads them.
 */
export function isoToUtcMs(iso) {
  if (iso === null || iso === undefined) return null;
  if (iso instanceof Date) return iso.getTime();
  if (typeof iso === "number") return iso;
  const hasZone = /(Z|[+-]\d\d:?\d\d)$/.test(iso);
  const ms = Date.parse(hasZone ? iso : `${iso}Z`);
  return Number.isNaN(ms) ? null : ms;
}

/** The variables list of a glTF dataset, or null when the dataset does not carry one. */
export function getVariables(dataset) {
  const variables = dataset?.viz?.variables;
  return Array.isArray(variables) && variables.length > 0 ? variables : null;
}

/** The variable of a dataset with the given name, or null. */
export function findVariable(dataset, name) {
  return getVariables(dataset)?.find((variable) => variable.name === name) ?? null;
}

/** Whether a variable has a time axis the Cesium clock can play through. */
export function isTimeDynamic(variable) {
  return Boolean(variable?.start && variable?.timesteps?.length > 1);
}

/** Milliseconds since the epoch of a time step, falling back to its hours offset from the variable start. */
function timestepMs(variable, timestep) {
  const ms = isoToUtcMs(timestep.time);
  if (ms !== null) return ms;
  const startMs = isoToUtcMs(variable.start);
  if (startMs === null || timestep.hours === null || timestep.hours === undefined) return null;
  return startMs + timestep.hours * MS_PER_HOUR;
}

/**
 * Index of the time step a variable should show at a given time: the last time step that starts at or before the
 * time, clamped to the first and last steps. Uses the actual time of each step rather than a fixed stride so a
 * variable that is missing a step still indexes correctly.
 *
 * @param variable  A viz.variables entry.
 * @param time      Milliseconds since the epoch, an ISO string or a Date. Null/undefined selects the first step.
 */
export function timestepIndexForTime(variable, time) {
  const timesteps = variable?.timesteps ?? [];
  if (timesteps.length < 2) return 0;
  const t = isoToUtcMs(time);
  if (t === null) return 0;
  let index = 0;
  for (let i = 0; i < timesteps.length; i++) {
    const stepMs = timestepMs(variable, timesteps[i]);
    if (stepMs === null || stepMs > t) break;
    index = i;
  }
  return index;
}

/** The time step a variable should show at a given time (see timestepIndexForTime), or null. */
export function timestepForTime(variable, time) {
  return variable?.timesteps?.[timestepIndexForTime(variable, time)] ?? null;
}

/**
 * Cesium clock settings for playing through a variable: ISO start/stop, the step in hours, the clock multiplier
 * (simulated seconds per wall-clock second) and the number of steps.
 */
export function clockSettingsForVariable(variable) {
  const timesteps = variable.timesteps ?? [];
  const last = timesteps[timesteps.length - 1];
  const stepHours = variable.step_hours ?? 1;
  return {
    start: variable.start ?? timesteps[0]?.time ?? null,
    stop: variable.end ?? last?.time ?? null,
    stepHours,
    multiplier: (stepHours * 3600) / SECONDS_PER_TIMESTEP_WALL,
    count: timesteps.length,
  };
}

/** The activeTimeSeries context value for a dataset variable, used by the panel, tree item and MeshClock. */
export function makeActiveTimeSeries(dataset, variable) {
  return {
    datasetId: dataset.id,
    variableName: variable.name,
    variable,
    ...clockSettingsForVariable(variable),
  };
}

/** Human readable UTC label for a time step time, e.g. "2004-06-01 10:00". */
export function formatTimestepTime(iso) {
  const ms = isoToUtcMs(iso);
  if (ms === null) return null;
  return new Date(ms).toISOString().slice(0, 16).replace("T", " ");
}
