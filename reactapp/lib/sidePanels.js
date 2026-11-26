// Side-panel ids of the Variables panes, one per dataset that has layers to pick from.
const VARIABLES_PANEL_ID_PREFIX = "slide-panel-";
export const variablesPanelId = (datasetId) => `${VARIABLES_PANEL_ID_PREFIX}${datasetId}`;
export const isVariablesPanelId = (panelId) =>
  typeof panelId === "string" && panelId.startsWith(VARIABLES_PANEL_ID_PREFIX);

/**
 * The open side panels once a panel is shown. Only one Variables pane is open at a time: showing one closes the
 * others, so the pane always belongs to the layer it was last asked for. Other kinds of panel are left as they are.
 */
export const withPanelShown = (panels, panelId) => [
  ...panels.filter((id) => id !== panelId && !(isVariablesPanelId(panelId) && isVariablesPanelId(id))),
  panelId,
];
