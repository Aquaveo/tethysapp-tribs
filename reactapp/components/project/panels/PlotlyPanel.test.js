/* eslint-disable react/prop-types -- the Plot mock below just echoes its props */
import { act, render, screen } from "@testing-library/react";

import { mockBackend, mockBackendAfterEach } from "config/tests/mocks/backend";
import { makeMrfDataset } from "config/tests/mocks/meshMock";
import { AppContext, GraphicsWindowVisualsContext, SidePanelContext } from "react-tethys/context";
import newUUID from "lib/uuid";
import PlotlyPanel, { seriesTitles } from "./PlotlyPanel";

jest.mock("react-plotly.js", () => function PlotMock(props) {
  return (
  <div
    data-testid="plot"
    data-title={props.layout?.title}
    data-yaxis={props.layout?.yaxis?.title?.text}
    data-xaxis={props.layout?.xaxis?.title?.text}
    data-trace={props.data?.[0]?.name ?? ""}
    data-y={JSON.stringify(props.data?.[0]?.y ?? null)}
  />
  );
});

afterEach(() => {
  mockBackendAfterEach();
});

async function renderPanel(dataset, layerName, selectedCZMLPoint) {
  const { server, backend } = await mockBackend();
  const panelId = `plotly-panel-${dataset.id}`;
  render(
    <AppContext.Provider value={{ backend, csrf: "12345" }}>
      <GraphicsWindowVisualsContext.Provider
        value={{ visibleCZMLObject: { [dataset.id]: layerName }, selectedCZMLPoint, startDates: [new Date(Date.UTC(2004, 5, 1))] }}
      >
        <SidePanelContext.Provider value={{ hideSidePanel: jest.fn(), showPanel: jest.fn(), visibleSidePanel: [panelId] }}>
          <PlotlyPanel dataset={dataset} panelId={panelId} realizationIndex={0} />
        </SidePanelContext.Provider>
      </GraphicsWindowVisualsContext.Provider>
    </AppContext.Provider>
  );
  return { server, backend };
}

describe("seriesTitles", () => {
  it("prefers the label and units sent with the series, then the dataset's variables, then the layer name", () => {
    const mrf = makeMrfDataset();
    expect(seriesTitles(mrf, "MDGW")).toEqual({
      label: "Depth to groundwater", units: "m", title: "Depth to groundwater (m)", yAxis: "m",
    });
    expect(seriesTitles(mrf, "MDGW", { label: "Groundwater depth", units: "mm" }).title).toBe("Groundwater depth (mm)");
    expect(seriesTitles({ id: "x", viz: { type: "czml", url: [] } }, "Nwt_mm")).toEqual({
      label: "Nwt", units: "mm", title: "Nwt (mm)", yAxis: "mm",
    });
    // No units anywhere: the label doubles as the y-axis title instead of the old raw layer name
    expect(seriesTitles({ id: "x", viz: { type: "czml", url: [] } }, "Hsrf")).toEqual({
      label: "Hsrf", units: null, title: "Hsrf", yAxis: "Hsrf",
    });
    expect(seriesTitles({ id: "x", viz: { type: "czml", url: [] } }, "Hsrf", { label: "Hsrf", units: "m³/s" }).yAxis).toBe("m³/s");
  });
});

describe("PlotlyPanel", () => {
  it("requests the raw layer name and titles the plot with the friendly label and units", async () => {
    const mrf = makeMrfDataset();
    const { server } = await renderPanel(mrf, "MDGW", `polygon_1 [${mrf.id}]`);
    await expect(server).toReceiveMessage(
      expect.stringContaining(`"type":"DATASET_GET_MRF_OR_RFT_TIMESERIES"},"payload":{"id":"${mrf.id}","variable":"MDGW"}`)
    );
    expect(screen.getByText("Depth to groundwater (m) Plot")).toBeInTheDocument();
    const plot = screen.getByTestId("plot");
    expect(plot).toHaveAttribute("data-title", "Depth to groundwater (m)");
    expect(plot).toHaveAttribute("data-yaxis", "m");
    expect(plot).toHaveAttribute("data-xaxis", "Time");
  });

  it("plots the series the backend sends, in its display units, named after the label", async () => {
    const mrf = makeMrfDataset();
    const { server, backend } = await renderPanel(mrf, "MDGW", `polygon_1 [${mrf.id}]`);
    await server.nextMessage;
    await act(async () => {
      server.send(JSON.stringify({
        action: { id: newUUID(), type: backend.actions.DATASET_GET_MRF_OR_RFT_TIMESERIES },
        payload: { x: [1, 2], y: [1.9, 2.0], name: "MDGW", label: "Depth to groundwater", units: "m" },
      }));
    });
    const plot = screen.getByTestId("plot");
    expect(plot).toHaveAttribute("data-trace", "Depth to groundwater");
    expect(plot).toHaveAttribute("data-y", "[1.9,2]");
    expect(plot).toHaveAttribute("data-yaxis", "m");
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
    expect(screen.getByText("Nwt (mm) Plot")).toBeInTheDocument();
    const plot = screen.getByTestId("plot");
    expect(plot).toHaveAttribute("data-title", "Nwt (mm)");
    expect(plot).toHaveAttribute("data-yaxis", "mm");
    expect(plot).toHaveAttribute("data-trace", "Nwt");
  });
});
