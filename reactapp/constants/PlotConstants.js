export const VARIABLE_SEPARATOR = "_"; // This is the character that separates the variable name from the unit name

// Unit tokens of the tRIBS pixel/qout file headers (as they appear in layer names, "/" written as "-") and how they
// are shown. Plain unicode so the same strings work in tree items, legends and Plotly titles. Mirrored by
// UNIT_TOKEN_NAMES in tribs_adapter.common.output_variables.
export const UNIT_NAMES = {
  "[]": null, // No units
  "mm": "mm", // Millimeters
  "m3-h": "m³/hr", // Meters^3/Hour
  "W-m2": "W/m²", // Watts/Meters^2
  "oC": "°C", // Degrees Celsius
  "d-l": "d/L", // something/Liters
  "m-s": "m/s", // Meters/Second
  "mm-h": "mm/hr", // Millimeters/Hour
  "mm-hr": "mm/hr", // Millimeters/Hour
  "m3-s": "m³/s", // Meters^3/Second
  "m2-s": "m²/s", // Meters^2/Second
  "m2-h": "m²/hr", // Meters^2/Hour
  "m": "m", // Meters
  "Pa": "Pa", // Pascals
  // Add any more that might pop up
};

// The plot sheet docks to the bottom of the window and covers this fraction of its height; the map stays visible
// above it (see PlotlyPanel and the viewer's SelectionFocus, which keeps the selected feature in that strip).
export const PLOT_SHEET_HEIGHT_FRACTION = 0.5;

// Side-panel ids of the plot sheets, one per CZML dataset.
const PLOT_PANEL_ID_PREFIX = "plotly-panel-";
export const plotPanelId = (datasetId) => `${PLOT_PANEL_ID_PREFIX}${datasetId}`;
export const isPlotPanelId = (panelId) => typeof panelId === "string" && panelId.startsWith(PLOT_PANEL_ID_PREFIX);

// A feature selected on the globe is identified as "<kind>_<n> [<dataset id>]" (the CZML entity id).
export const selectionDatasetId = (selection) =>
  (typeof selection === "string" ? selection.match(/\[(.*?)\]/)?.[1] : undefined) ?? null;
export const isSelectionOf = (selection, datasetId) => selectionDatasetId(selection) === datasetId;
