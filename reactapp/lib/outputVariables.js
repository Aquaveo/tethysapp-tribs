// How tRIBS output variables are presented: friendly labels, display units and priority tiers.
//
// The backend (tribs_adapter.common.output_variables) is the source of truth. For the file kinds the scientist's
// sheet covers it emits, per layer, `{ name, label, units, tier, description, factor }` in `viz.variables` (glTF
// mesh output and CZML output alike) and labels the timeseries it serves. Everything here is a fallback for datasets
// visualized before that existed, or for file kinds the sheet does not cover: the raw layer name is split into the
// column name and the unit token of the file header (`Nwt_mm` -> "Nwt (mm)"), and nothing is tiered.
//
// `name` is always the raw layer key the rest of the app selects by; only what is shown changes.
import { UNIT_NAMES, VARIABLE_SEPARATOR } from "constants/PlotConstants";
import extractLayerName from "lib/extractLayerName";

export const PRIORITY = "priority";
export const SECONDARY = "secondary";

/** The column name and display units of a layer name with a header unit token: `Qstrm_m3-s` -> Qstrm, m³/s. */
export function splitUnitToken(layerName) {
  const name = String(layerName ?? "");
  const separator = name.lastIndexOf(VARIABLE_SEPARATOR);
  if (separator > 0) {
    const token = name.slice(separator + 1);
    if (Object.prototype.hasOwnProperty.call(UNIT_NAMES, token)) {
      return { base: name.slice(0, separator), units: UNIT_NAMES[token] };
    }
  }
  return { base: name, units: null };
}

/**
 * The layer names a dataset offers when it carries no `viz.variables`: one per viz url. WMS datasets hold a single
 * endpoint string in `viz.url` rather than a list of layer files, so they offer no layers this way.
 */
function layerNamesFromUrls(dataset) {
  const urls = dataset?.viz?.url;
  if (!Array.isArray(urls)) return [];
  return urls.map((url) => extractLayerName(url, dataset.id));
}

/** Whether a layer name is one of the dataset's layers (by `viz.variables` or by url). */
export function isLayerOf(dataset, layerName) {
  if (!layerName) return false;
  const variables = dataset?.viz?.variables;
  if (Array.isArray(variables) && variables.length > 0) {
    return variables.some((variable) => variable.name === layerName);
  }
  return layerNamesFromUrls(dataset).includes(layerName);
}

/**
 * The presentation of one layer of a dataset: its `viz.variables` entry when the backend provided one, otherwise
 * a fallback built from the layer name (`{ name, label, units, tier: null, description: "" }`).
 */
export function describeLayer(dataset, layerName) {
  const variables = dataset?.viz?.variables;
  const known = Array.isArray(variables) ? variables.find((variable) => variable.name === layerName) : undefined;
  if (known) return known;
  const { base, units } = splitUnitToken(layerName);
  return { name: layerName, label: base, units, tier: null, description: "" };
}

/** The friendly name of a variable (a `viz.variables` entry or a fallback from describeLayer). */
export function variableLabel(variable) {
  if (!variable) return "";
  if (variable.label) return variable.label;
  return splitUnitToken(variable.name).base;
}

/** The display units of a variable, or null. */
export function variableUnits(variable) {
  if (!variable) return null;
  if (variable.units !== undefined) return variable.units;
  return splitUnitToken(variable.name).units;
}

/** "Streamflow (m³/s)", or just the label when the variable has no units. */
export function variableTitle(variable) {
  const label = variableLabel(variable);
  const units = variableUnits(variable);
  return units ? `${label} (${units})` : label;
}

/**
 * The entries of a dataset's layer list in their display order: one per `viz.variables` entry when present (the
 * backend already orders priority before secondary), otherwise one per viz url.
 */
export function layerEntries(dataset) {
  const variables = dataset?.viz?.variables;
  if (Array.isArray(variables) && variables.length > 0) return variables;
  return layerNamesFromUrls(dataset).map((layerName) => describeLayer(dataset, layerName));
}

/**
 * Split layer items into the ones shown up front (priority and untiered, in the given order) and the ones tucked
 * into a collapsed "More variables" group (secondary). Items are anything with a `tier` field.
 */
export function groupByTier(items) {
  const primary = items.filter((item) => item.tier !== SECONDARY);
  const more = items.filter((item) => item.tier === SECONDARY);
  return { primary, more };
}
