/* eslint-disable react/prop-types -- the Plot mock below just echoes its props */
import userEvent from "@testing-library/user-event";
import { act, render, screen } from "@testing-library/react";

import { mockBackend, mockBackendAfterEach } from "config/tests/mocks/backend";
import { makeMrfDataset } from "config/tests/mocks/meshMock";
import { AppContext, GraphicsWindowVisualsContext, SidePanelContext } from "react-tethys/context";
import newUUID from "lib/uuid";
import PlotlyPanel, { plotAreaLeft, seriesTitles, showLegend } from "./PlotlyPanel";

// A plotted graph div as Plotly leaves it: the plot area starts 85px in (a long y-axis title, say)
const FAKE_GRAPH_DIV = { _fullLayout: { _size: { l: 85 } } };

jest.mock("react-plotly.js", () => function PlotMock(props) {
  const React = require("react");
  React.useEffect(() => {
    props.onInitialized?.({}, FAKE_GRAPH_DIV);
    props.onAfterPlot?.();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- once, like Plotly's first draw
  return (
  <div
    data-testid="plot"
    data-plot-left={props.style?.["--plot-left"] ?? ""}
    data-title={String(props.layout?.title)}
    data-showlegend={String(props.layout?.showlegend)}
    data-legend-orientation={props.layout?.legend?.orientation}
    data-ytype={props.layout?.yaxis?.type}
    data-yaxis={props.layout?.yaxis?.title?.text}
    data-xaxis={props.layout?.xaxis?.title?.text}
    data-autosize={String(props.layout?.autosize)}
    data-trace={props.data?.[0]?.name ?? ""}
    data-y={JSON.stringify(props.data?.[0]?.y ?? null)}
  />
  );
});

afterEach(() => {
  mockBackendAfterEach();
});

async function renderPanel(dataset, layerName, selectedCZMLPoint, { otherPanels = [] } = {}) {
  const { server, backend } = await mockBackend();
  const panelId = `plotly-panel-${dataset.id}`;
  const sidePanels = { hideSidePanel: jest.fn(), showPanel: jest.fn(), visibleSidePanel: [panelId, ...otherPanels] };
  const setSelectedCZMLPoint = jest.fn();
  render(
    <AppContext.Provider value={{ backend, csrf: "12345" }}>
      <GraphicsWindowVisualsContext.Provider
        value={{ visibleCZMLObject: { [dataset.id]: layerName }, selectedCZMLPoint, setSelectedCZMLPoint, startDates: [new Date(Date.UTC(2004, 5, 1))] }}
      >
        <SidePanelContext.Provider value={sidePanels}>
          <PlotlyPanel dataset={dataset} panelId={panelId} realizationIndex={0} />
        </SidePanelContext.Provider>
      </GraphicsWindowVisualsContext.Provider>
    </AppContext.Provider>
  );
  return { server, backend, sidePanels, setSelectedCZMLPoint };
}

describe("seriesTitles", () => {
  it("prefers the label and units sent with the series, then the dataset's variables, then the layer name", () => {
    const mrf = makeMrfDataset();
    expect(seriesTitles(mrf, "MDGW")).toEqual({
      label: "Depth to Groundwater", units: "m", title: "Depth to Groundwater (m)", yAxis: "Depth to Groundwater (m)",
    });
    expect(seriesTitles(mrf, "MDGW", { label: "Groundwater depth", units: "mm" }).title).toBe("Groundwater depth (mm)");
    expect(seriesTitles({ id: "x", viz: { type: "czml", url: [] } }, "Nwt_mm")).toEqual({
      label: "Nwt", units: "mm", title: "Nwt (mm)", yAxis: "Nwt (mm)",
    });
    // No units anywhere: the y-axis title is just the label
    expect(seriesTitles({ id: "x", viz: { type: "czml", url: [] } }, "Hsrf")).toEqual({
      label: "Hsrf", units: null, title: "Hsrf", yAxis: "Hsrf",
    });
    expect(seriesTitles({ id: "x", viz: { type: "czml", url: [] } }, "Hsrf", { label: "Hsrf", units: "m³/s" }).yAxis).toBe("Hsrf (m³/s)");
  });
});

describe("PlotlyPanel", () => {
  it("docks to the bottom half of the window, with a plot that fills it", async () => {
    const mrf = makeMrfDataset();
    await renderPanel(mrf, "MDGW", `polygon_1 [${mrf.id}]`);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveClass("offcanvas-bottom");
    expect(dialog.style.height).toBe("calc(50vh - 60px)");
    expect(dialog.style.marginBottom).toBe("60px");
    expect(screen.getByTestId("plot")).toHaveAttribute("data-autosize", "true");
  });

  it("requests the raw layer name and titles the plot with the friendly label and units", async () => {
    const mrf = makeMrfDataset();
    const { server } = await renderPanel(mrf, "MDGW", `polygon_1 [${mrf.id}]`);
    await expect(server).toReceiveMessage(
      expect.stringContaining(`"type":"DATASET_GET_MRF_OR_RFT_TIMESERIES"},"payload":{"id":"${mrf.id}","variable":"MDGW"}`)
    );
    expect(screen.getByText("Depth to Groundwater Plot")).toBeInTheDocument(); // the units are on the y axis
    const plot = screen.getByTestId("plot");
    expect(plot).toHaveAttribute("data-title", "undefined"); // no plot title: the header and y axis already name it
    expect(plot).toHaveAttribute("data-yaxis", "Depth to Groundwater (m)");
    expect(plot).toHaveAttribute("data-xaxis", "Time");
  });

  it("plots the series the backend sends, in its display units, named after the label", async () => {
    const mrf = makeMrfDataset();
    const { server, backend } = await renderPanel(mrf, "MDGW", `polygon_1 [${mrf.id}]`);
    await server.nextMessage;
    await act(async () => {
      server.send(JSON.stringify({
        action: { id: newUUID(), type: backend.actions.DATASET_GET_MRF_OR_RFT_TIMESERIES },
        payload: { x: [1, 2], y: [1.9, 2.0], name: "MDGW", label: "Depth to Groundwater", units: "m" },
      }));
    });
    const plot = screen.getByTestId("plot");
    expect(plot).toHaveAttribute("data-trace", "Depth to Groundwater");
    expect(plot).toHaveAttribute("data-y", "[1.9,2]");
    expect(plot).toHaveAttribute("data-yaxis", "Depth to Groundwater (m)");
    expect(plot).toHaveAttribute("data-title", "undefined");
    expect(plot).toHaveAttribute("data-showlegend", "false"); // one series: the header names it
    expect(plot).toHaveAttribute("data-legend-orientation", "h"); // several series would list them under the plot
  });

  it("changes the y-axis scale from the settings menu in the header", async () => {
    const user = userEvent.setup();
    const mrf = makeMrfDataset();
    await renderPanel(mrf, "MDGW", `polygon_1 [${mrf.id}]`);
    expect(screen.getByTestId("plot")).toHaveAttribute("data-ytype", "linear");
    const header = screen.getByTestId("slide-sheet-actions");
    await user.click(screen.getByRole("button", { name: "Plot settings" }));
    expect(header).toContainElement(screen.getByRole("button", { name: "Plot settings" }));
    await user.click(screen.getByText("Y Axis Scale: Linear"));
    await user.click(screen.getByRole("menuitemradio", { name: "Log" }));
    expect(screen.getByTestId("plot")).toHaveAttribute("data-ytype", "log");
    await user.click(screen.getByRole("button", { name: "Plot settings" }));
    expect(screen.getByText("Y Axis Scale: Log")).toBeInTheDocument();
  });

  it("opens the dataset's Variables panel from the settings menu", async () => {
    const user = userEvent.setup();
    const mrf = makeMrfDataset();
    const { sidePanels } = await renderPanel(mrf, "MDGW", `polygon_1 [${mrf.id}]`);
    await user.click(screen.getByRole("button", { name: "Plot settings" }));
    await user.click(screen.getByRole("button", { name: "Open Variables Panel" }));
    expect(sidePanels.showPanel).toHaveBeenCalledWith(`slide-panel-${mrf.id}`);
    expect(sidePanels.hideSidePanel).not.toHaveBeenCalled();
  });

  it("closes the dataset's Variables panel from the settings menu when it is open", async () => {
    const user = userEvent.setup();
    const mrf = makeMrfDataset();
    const { sidePanels } = await renderPanel(mrf, "MDGW", `polygon_1 [${mrf.id}]`, { otherPanels: [`slide-panel-${mrf.id}`] });
    await user.click(screen.getByRole("button", { name: "Plot settings" }));
    await user.click(screen.getByRole("button", { name: "Close Variables Panel" }));
    expect(sidePanels.hideSidePanel).toHaveBeenCalledWith(`slide-panel-${mrf.id}`);
    expect(sidePanels.showPanel).not.toHaveBeenCalled();
  });

  it("hides itself and clears the selected feature when closed", async () => {
    const user = userEvent.setup();
    const mrf = makeMrfDataset();
    const { sidePanels, setSelectedCZMLPoint } = await renderPanel(mrf, "MDGW", `polygon_1 [${mrf.id}]`);
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(sidePanels.hideSidePanel).toHaveBeenCalledWith(`plotly-panel-${mrf.id}`);
    expect(setSelectedCZMLPoint).toHaveBeenCalledWith(null);
    expect(screen.getByRole("dialog")).toHaveAttribute("data-plot-sheet");
  });

  it("leaves another dataset's selected feature alone when closed", async () => {
    const user = userEvent.setup();
    const mrf = makeMrfDataset();
    const { setSelectedCZMLPoint } = await renderPanel(mrf, "MDGW", "point_3 [some-other-dataset]");
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(setSelectedCZMLPoint).not.toHaveBeenCalled();
  });

  it("aligns the toolbar with the y axis by publishing the plot area's left edge after each draw", async () => {
    const mrf = makeMrfDataset();
    await renderPanel(mrf, "MDGW", `polygon_1 [${mrf.id}]`);
    expect(screen.getByTestId("plot")).toHaveAttribute("data-plot-left", "85px");
  });

  it("reads the plot area's left edge from a plotted graph div, and nothing from an unplotted one", () => {
    expect(plotAreaLeft(FAKE_GRAPH_DIV)).toBe(85);
    expect(plotAreaLeft({})).toBeNull();
    expect(plotAreaLeft(null)).toBeNull();
    expect(plotAreaLeft({ _fullLayout: { _size: { l: NaN } } })).toBeNull();
  });

  it("shows a legend only when there are several series", () => {
    expect(showLegend([])).toBe(false);
    expect(showLegend([{ name: "a" }])).toBe(false);
    expect(showLegend([{ name: "a" }, { name: "b" }])).toBe(true);
  });

  it("ignores a series read from another dataset", async () => {
    const mrf = makeMrfDataset();
    const { server, backend } = await renderPanel(mrf, "MDGW", `polygon_1 [${mrf.id}]`);
    await server.nextMessage;
    await act(async () => {
      server.send(JSON.stringify({
        action: { id: newUUID(), type: backend.actions.DATASET_GET_MRF_OR_RFT_TIMESERIES },
        payload: { x: [1, 2], y: [5, 6], dataset_id: "another-dataset", name: "MDGW", label: "Other", units: "m" },
      }));
    });
    expect(screen.getByTestId("plot")).toHaveAttribute("data-y", "null");
  });

  it("ignores a series of a variable that is no longer the selected one", async () => {
    const mrf = makeMrfDataset();
    const { server, backend } = await renderPanel(mrf, "MDGW", `polygon_1 [${mrf.id}]`);
    await server.nextMessage;
    await act(async () => {
      server.send(JSON.stringify({
        action: { id: newUUID(), type: backend.actions.DATASET_GET_MRF_OR_RFT_TIMESERIES },
        payload: { x: [1, 2], y: [5, 6], dataset_id: mrf.id, name: "MAP", label: "Mean Areal Precipitation", units: "mm/hr" },
      }));
    });
    const plot = screen.getByTestId("plot");
    expect(plot).toHaveAttribute("data-y", "null");
    expect(plot).toHaveAttribute("data-yaxis", "Depth to Groundwater (m)");
  });

  it("ignores a series of a point that is no longer the selected one", async () => {
    const pixel = { ...makeMrfDataset(), dataset_type: "TRIBS_OUT_PIXEL", viz: { type: "czml", url: ["fdb/fc/czml/x-Nwt_mm.czml"] } };
    const { server, backend } = await renderPanel(pixel, "Nwt_mm", `point_72 [${pixel.id}]`);
    await server.nextMessage;
    const send = (pointId, y) => act(async () => {
      server.send(JSON.stringify({
        action: { id: newUUID(), type: backend.actions.DATASET_GET_PIXEL_TIMESERIES },
        payload: { x: [0, 1], y, dataset_id: pixel.id, point_id: pointId, name: "Nwt_mm", label: "Nwt", units: "mm" },
      }));
    });
    await send("15", [1, 2]);
    expect(screen.getByTestId("plot")).toHaveAttribute("data-y", "null");
    await send("72", [0, 18.3]);
    expect(screen.getByTestId("plot")).toHaveAttribute("data-y", "[0,18.3]");
  });

  it("gives a series to the plot sheet of its dataset, whichever sheet was rendered last", async () => {
    const first = makeMrfDataset();
    const second = { ...makeMrfDataset(), id: newUUID() };
    const { server, backend } = await mockBackend();
    const sidePanels = {
      hideSidePanel: jest.fn(),
      showPanel: jest.fn(),
      visibleSidePanel: [`plotly-panel-${first.id}`, `plotly-panel-${second.id}`],
    };
    render(
      <AppContext.Provider value={{ backend, csrf: "12345" }}>
        <GraphicsWindowVisualsContext.Provider
          value={{
            visibleCZMLObject: { [first.id]: "MDGW", [second.id]: "MDGW" },
            selectedCZMLPoint: `polygon_1 [${first.id}]`,
            setSelectedCZMLPoint: jest.fn(),
            startDates: [new Date(Date.UTC(2004, 5, 1))],
          }}
        >
          <SidePanelContext.Provider value={sidePanels}>
            <PlotlyPanel dataset={first} panelId={`plotly-panel-${first.id}`} realizationIndex={0} />
            <PlotlyPanel dataset={second} panelId={`plotly-panel-${second.id}`} realizationIndex={0} />
          </SidePanelContext.Provider>
        </GraphicsWindowVisualsContext.Provider>
      </AppContext.Provider>
    );
    await server.nextMessage;
    await act(async () => {
      server.send(JSON.stringify({
        action: { id: newUUID(), type: backend.actions.DATASET_GET_MRF_OR_RFT_TIMESERIES },
        payload: { x: [1, 2], y: [1.9, 2.0], dataset_id: first.id, name: "MDGW", label: "Depth to Groundwater", units: "m" },
      }));
    });
    const [firstPlot, secondPlot] = screen.getAllByTestId("plot");
    expect(firstPlot).toHaveAttribute("data-y", "[1.9,2]");
    expect(secondPlot).toHaveAttribute("data-y", "null");
  });

  it("keeps the layer-name titles for a series from an older backend", async () => {
    const pixel = { ...makeMrfDataset(), dataset_type: "TRIBS_OUT_PIXEL", viz: { type: "czml", url: ["fdb/fc/czml/x-Nwt_mm.czml"] } };
    const { server, backend } = await renderPanel(pixel, "Nwt_mm", `point_72 [${pixel.id}]`);
    await expect(server).toReceiveMessage(expect.stringContaining('"point_id":"72","variable":"Nwt_mm"'));
    await act(async () => {
      server.send(JSON.stringify({
        action: { id: newUUID(), type: backend.actions.DATASET_GET_PIXEL_TIMESERIES },
        payload: { x: [0, 1], y: [0, 18.3] },
      }));
    });
    expect(screen.getByText("Nwt Plot")).toBeInTheDocument();
    const plot = screen.getByTestId("plot");
    expect(plot).toHaveAttribute("data-title", "undefined");
    expect(plot).toHaveAttribute("data-yaxis", "Nwt (mm)");
    expect(plot).toHaveAttribute("data-trace", "Nwt");
  });
});
