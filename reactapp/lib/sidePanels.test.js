import { isVariablesPanelId, variablesPanelId, withPanelShown } from "./sidePanels";

describe("sidePanels", () => {
  it("recognises the ids of Variables panes", () => {
    expect(isVariablesPanelId(variablesPanelId("a"))).toBe(true);
    expect(isVariablesPanelId("plotly-panel-a")).toBe(false);
    expect(isVariablesPanelId(undefined)).toBe(false);
  });

  it("closes the other Variables panes when one is shown", () => {
    expect(withPanelShown(["slide-panel-a", "plotly-panel-a"], "slide-panel-b"))
      .toEqual(["plotly-panel-a", "slide-panel-b"]);
  });

  it("leaves the Variables pane open when another kind of panel is shown", () => {
    expect(withPanelShown(["slide-panel-a"], "plotly-panel-b")).toEqual(["slide-panel-a", "plotly-panel-b"]);
  });

  it("does not list a panel twice when it is shown again", () => {
    expect(withPanelShown(["slide-panel-a", "plotly-panel-a"], "slide-panel-a"))
      .toEqual(["plotly-panel-a", "slide-panel-a"]);
  });
});
