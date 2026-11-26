import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { select } from "react-select-event";

import { GraphicsWindowVisualsContext } from "react-tethys/context";
import {
  makeLayerValues,
  makeMrfDataset,
  makeStaticMesh,
  makeTimeSeriesMesh,
  makeValueLayer,
} from "config/tests/mocks/meshMock";
import LegendCard from "./LegendCard";

// The values of a value layer's variable, as the hook returns them once loaded (null: still loading). A plain
// function, not jest.fn: the jest config resets mock implementations before every test.
let mockLayerValues = null;
jest.mock("hooks/useLayerValues", () => ({
  __esModule: true,
  // eslint-disable-next-line no-undef
  default: (url) => (url ? mockLayerValues : null),
}));

function renderCard({ dataset, colorRamps = {}, meshClockTime = null, selectedCZMLPoint = null, ...props }) {
  const setColorRamp = jest.fn();
  const setCZMLLayer = jest.fn();
  const setActiveTimeSeries = jest.fn();
  const onColorRampChange = jest.fn();
  const utils = render(
    <GraphicsWindowVisualsContext.Provider value={{ colorRamps, setColorRamp, meshClockTime, selectedCZMLPoint, setCZMLLayer, setActiveTimeSeries }}>
      <LegendCard dataset={dataset} onColorRampChange={onColorRampChange} {...props} />
    </GraphicsWindowVisualsContext.Provider>
  );
  return { ...utils, setColorRamp, onColorRampChange, setCZMLLayer, setActiveTimeSeries };
}

beforeEach(() => {
  process.env.TETHYS_MEDIA_URL = "/media/";
  mockLayerValues = null;
});

it("shows the legend image drawn with the files for the default ramp, with the time step subtitle", () => {
  const dataset = makeTimeSeriesMesh();
  const variable = dataset.viz.variables[0];
  renderCard({
    dataset,
    uniqueId: "Mu",
    legendUrls: [variable.timesteps[1].legend],
    subtitle: variable.timesteps[1].time,
    variable,
  });
  expect(screen.getByRole("img")).toHaveAttribute("src", "/media/" + variable.timesteps[1].legend);
  expect(screen.getByTestId("legend-subtitle")).toHaveTextContent("UTC");
  expect(screen.queryByTestId("gltf-legend")).not.toBeInTheDocument();
  expect(screen.getByText("Topo Atlas (default)")).toBeInTheDocument();
});

it("draws its own legend for the ramp saved on the dataset, over the variable's range", () => {
  const dataset = { ...makeTimeSeriesMesh(), attributes: { color_ramp: "viridis" } };
  const variable = dataset.viz.variables[1]; // Nwt: 1.5 .. 3.5
  renderCard({ dataset, uniqueId: "Nwt", legendUrls: [variable.timesteps[0].legend], variable });
  expect(screen.queryByRole("img", { name: /Legend$/ })).not.toBeInTheDocument(); // no PNG
  expect(screen.getByTestId("gltf-legend")).toBeInTheDocument();
  expect(screen.getAllByTestId("gltf-legend-tick").map((el) => el.textContent)).toEqual([
    "1.50", "2.00", "2.50", "3.00", "3.50",
  ]);
  expect(screen.getByText("Viridis")).toBeInTheDocument();
});

it("lets the ramp chosen in this session override the saved one, and copes with datasets without a range", () => {
  const dataset = { ...makeStaticMesh(), attributes: { color_ramp: "viridis" } };
  const variable = { ...dataset.viz.variables[0], min: undefined, max: undefined }; // generated before min/max
  renderCard({ dataset, uniqueId: dataset.id, variable, colorRamps: { [dataset.id]: "turbo" } });
  expect(screen.getByText("Turbo")).toBeInTheDocument();
  expect(screen.queryAllByTestId("gltf-legend-tick")).toHaveLength(0);
  expect(screen.getByTestId("gltf-legend-note")).toBeInTheDocument();
});

it("applies a newly chosen ramp right away and saves it on the dataset", async () => {
  const dataset = makeStaticMesh();
  const { setColorRamp, onColorRampChange } = renderCard({
    dataset,
    uniqueId: dataset.id,
    variable: dataset.viz.variables[0],
  });
  // The menu is portaled to document.body so the side panel does not clip it. (Not wrapped in act: the helper
  // waits for the menu, and an outer act would hold back the DOM updates it waits for.)
  await select(screen.getByLabelText("Color ramp"), "Plasma", { container: document.body });
  expect(setColorRamp).toHaveBeenCalledWith(dataset.id, "plasma");
  expect(onColorRampChange).toHaveBeenCalledWith("plasma");
});

describe("value layers (node, outlet and basin output)", () => {
  it("offers the ramp selector with white-blue as the default and draws the legend over the variable's range", () => {
    const dataset = makeValueLayer(); // Nwt_mm: 0 .. 100 mm
    renderCard({ dataset, uniqueId: "Nwt_mm" });
    expect(screen.getByLabelText("Color ramp")).toBeInTheDocument();
    expect(screen.getByText("White-Blue (default)")).toBeInTheDocument();
    expect(screen.queryByText("Topo Atlas (default)")).not.toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /Legend$/ })).not.toBeInTheDocument(); // no PNG
    expect(screen.getAllByTestId("gltf-legend-tick").map((el) => el.textContent)).toEqual([
      "0.00", "25.00", "50.00", "75.00", "100.00",
    ]);
    expect(screen.getByTestId("legend-variable")).toHaveTextContent("Nwt");
    expect(screen.getByTestId("legend-units")).toHaveTextContent("mm");
  });

  it("draws the legend with the ramp saved on the dataset", () => {
    const dataset = { ...makeValueLayer(), attributes: { color_ramp: "viridis" } };
    renderCard({ dataset, uniqueId: "Nwt_mm" });
    expect(screen.getByText("Viridis")).toBeInTheDocument();
    expect(screen.getByTestId("gltf-legend")).toBeInTheDocument();
  });

  it("applies a newly chosen ramp right away and saves it on the dataset", async () => {
    const dataset = makeValueLayer();
    const { setColorRamp, onColorRampChange } = renderCard({ dataset, uniqueId: "Nwt_mm" });
    await select(screen.getByLabelText("Color ramp"), "Plasma", { container: document.body });
    expect(setColorRamp).toHaveBeenCalledWith(dataset.id, "plasma");
    expect(onColorRampChange).toHaveBeenCalledWith("plasma");
  });

  it("names the time of the row shown at the clock time", () => {
    const dataset = makeValueLayer();
    mockLayerValues = makeLayerValues(dataset.id); // rows at 01:00, 02:00 and 03:00
    const { rerender } = renderCard({ dataset, uniqueId: "Nwt_mm", meshClockTime: Date.UTC(2004, 5, 1, 2, 30) });
    expect(screen.getByTestId("legend-subtitle")).toHaveTextContent("2004-06-01 02:00 UTC");
    rerender(
      <GraphicsWindowVisualsContext.Provider value={{ colorRamps: {}, meshClockTime: null }}>
        <LegendCard dataset={dataset} uniqueId="Nwt_mm" />
      </GraphicsWindowVisualsContext.Provider>
    );
    expect(screen.getByTestId("legend-subtitle")).toHaveTextContent("2004-06-01 01:00 UTC"); // the first row
  });

  it("points out the selected feature's value at the time shown, on the bar and in words", () => {
    const dataset = makeValueLayer(); // Nwt_mm: 0 .. 100 mm; node 42 = 0, 50, 100; node 1656 = 100, null, 0
    mockLayerValues = makeLayerValues(dataset.id);
    renderCard({
      dataset, uniqueId: "Nwt_mm", meshClockTime: Date.UTC(2004, 5, 1, 2, 30), selectedCZMLPoint: `point_42 [${dataset.id}]`,
    });
    expect(screen.getByTestId("gltf-legend-marker")).toHaveAttribute("data-x", "160"); // half way along the bar
    expect(screen.getByTestId("legend-marked-value")).toHaveTextContent("Selected feature: 50.00 mm");
  });

  it("ticks the values of the layer's other features at the time shown, with or without a selection", () => {
    const dataset = makeValueLayer(); // node 42 = 0, 50, 100; node 1656 = 100, null, 0
    mockLayerValues = makeLayerValues(dataset.id);
    const xs = () => screen.queryAllByTestId("gltf-legend-value-tick").map((el) => el.getAttribute("data-x"));
    const { unmount } = renderCard({ dataset, uniqueId: "Nwt_mm" }); // nothing selected: a tick per node
    expect(xs()).toEqual(["10", "310"]);
    unmount();
    renderCard({
      dataset, uniqueId: "Nwt_mm", meshClockTime: Date.UTC(2004, 5, 1, 3), selectedCZMLPoint: `point_42 [${dataset.id}]`,
    });
    expect(xs()).toEqual(["10"]); // node 1656 at 03:00; node 42 is the marker
    expect(screen.getByTestId("gltf-legend-marker")).toHaveAttribute("data-x", "310");
  });

  it("points nothing out without a selected feature of the layer, or where the feature has no value", () => {
    const dataset = makeValueLayer();
    mockLayerValues = makeLayerValues(dataset.id);
    const { unmount } = renderCard({ dataset, uniqueId: "Nwt_mm", selectedCZMLPoint: "point_42 [another-dataset]" });
    expect(screen.queryByTestId("gltf-legend-marker")).not.toBeInTheDocument();
    expect(screen.queryByTestId("legend-marked-value")).not.toBeInTheDocument();
    unmount();
    renderCard({
      dataset, uniqueId: "Nwt_mm", meshClockTime: Date.UTC(2004, 5, 1, 2), selectedCZMLPoint: `point_1656 [${dataset.id}]`,
    });
    expect(screen.queryByTestId("gltf-legend-marker")).not.toBeInTheDocument(); // no value at 02:00
  });

  it("ticks the value of a layer's only feature (the basin) and points it out only once it is selected", () => {
    const dataset = makeValueLayer();
    const basin = `polygon [${dataset.id}]`;
    mockLayerValues = { ...makeLayerValues(dataset.id), ids: [basin], values: [[25, 0.004, 100]] };
    const { unmount } = renderCard({ dataset, uniqueId: "Nwt_mm" });
    expect(screen.getAllByTestId("gltf-legend-value-tick").map((el) => el.getAttribute("data-x"))).toEqual(["85"]);
    expect(screen.queryByTestId("gltf-legend-marker")).not.toBeInTheDocument();
    expect(screen.queryByTestId("legend-marked-value")).not.toBeInTheDocument();
    unmount();
    const { rerender } = renderCard({ dataset, uniqueId: "Nwt_mm", selectedCZMLPoint: basin });
    expect(screen.getByTestId("gltf-legend-marker")).toHaveAttribute("data-x", "85"); // a quarter along, first row
    expect(screen.queryByTestId("gltf-legend-value-tick")).not.toBeInTheDocument();
    expect(screen.getByTestId("legend-marked-value")).toHaveTextContent("Selected feature: 25.00 mm");
    rerender(
      <GraphicsWindowVisualsContext.Provider
        value={{ colorRamps: {}, meshClockTime: Date.UTC(2004, 5, 1, 2), selectedCZMLPoint: basin }}
      >
        <LegendCard dataset={dataset} uniqueId="Nwt_mm" />
      </GraphicsWindowVisualsContext.Provider>
    );
    expect(screen.getByTestId("legend-marked-value")).toHaveTextContent("Selected feature: 0.0040 mm"); // not "0.00"
  });

  it("writes no time while the values are loading, and labels a variable without a range like the server did", () => {
    const dataset = makeValueLayer();
    renderCard({ dataset, uniqueId: "Srf_mm" }); // every value 0
    expect(screen.queryByTestId("legend-subtitle")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("gltf-legend-tick").map((el) => el.textContent)).toEqual([
      "0.00", "0.25", "0.50", "0.75", "1.00",
    ]);
  });
});

it("offers no ramp selector for other visualization types", () => {
  const dataset = {
    ...makeStaticMesh(),
    // WMS viz carries one endpoint string as its url, not a list of layer files
    viz: {
      type: "wms",
      url: "http://host/geoserver/wms",
      legend: ["http://host/geoserver/wms?REQUEST=GetLegendGraphic&LAYER=x_y"],
    },
  };
  renderCard({ dataset, uniqueId: dataset.id });
  expect(screen.queryByLabelText("Color ramp")).not.toBeInTheDocument();
  expect(screen.getByRole("img")).toBeInTheDocument();
});

it("collapses and expands its body from the header button", async () => {
  const user = userEvent.setup();
  const mrf = makeMrfDataset();
  renderCard({ dataset: mrf, uniqueId: "MDGW", legendUrls: [mrf.viz.legend[1]] });
  const toggle = screen.getByRole("button", { name: "Basin Averages legend" });
  expect(toggle).toHaveAttribute("aria-expanded", "true");
  expect(toggle).toHaveAttribute("title", "Collapse legend");
  await user.click(toggle);
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect(toggle).toHaveAttribute("title", "Expand legend");
  expect(screen.getByTestId("legend-owner")).toHaveTextContent("Basin Averages"); // the header stays
  expect(screen.getByTestId("legend-variable")).toBeInTheDocument(); // the body is collapsed, not removed
});

it("starts collapsed when asked", () => {
  const mrf = makeMrfDataset();
  renderCard({ dataset: mrf, uniqueId: "MDGW", legendUrls: [mrf.viz.legend[1]], defaultOpen: false });
  expect(screen.getByRole("button", { name: "Basin Averages legend" })).toHaveAttribute("aria-expanded", "false");
});

it("copes with a GeoServer legend url that names no layer", () => {
  const dataset = {
    ...makeStaticMesh(),
    viz: { type: "wms", url: "http://host/geoserver/wms", legend: ["http://host/geoserver/wms?REQUEST=GetLegendGraphic"], env_str: { x: "a:1" } },
  };
  renderCard({ dataset, uniqueId: dataset.id });
  expect(screen.getByRole("img")).toHaveAttribute("src", "http://host/geoserver/wms?REQUEST=GetLegendGraphic&ENV=%5Bobject%20Object%5D");
});

describe("legend layout", () => {
  it("writes the realization, dataset, variable, units and time step around a CZML legend", () => {
    const mrf = makeMrfDataset();
    renderCard({ dataset: mrf, uniqueId: "MDGW", legendUrls: [mrf.viz.legend[1]], realizationName: "Run 1" });
    expect(screen.getByTestId("legend-realization")).toHaveTextContent("Run 1");
    expect(screen.getByTestId("legend-owner")).toHaveTextContent("Basin Averages");
    expect(screen.getByTestId("legend-owner")).not.toHaveTextContent("Run 1");
    expect(screen.getByTestId("legend-units")).toHaveStyle({ textAlign: "center" });
    expect(screen.getByTestId("legend-variable")).toHaveTextContent("Depth to Groundwater");
    expect(screen.getByTestId("legend-units")).toHaveTextContent("m");
    expect(screen.queryByLabelText("Color ramp")).not.toBeInTheDocument();
  });

  it("falls back to the layer name and header units for CZML output without labels", () => {
    const dataset = {
      ...makeStaticMesh(),
      viz: { type: "czml", url: ["fdb/fc/czml/2d2f4b6f-6e1c-4a9f-8b3b-7e7b8f2d3c4e-Nwt_mm.czml"], legend: ["fdb/fc/czml/x_point_legend.png"] },
    };
    renderCard({ dataset, uniqueId: "Nwt_mm" });
    expect(screen.getByTestId("legend-owner")).toHaveTextContent("Mesh");
    expect(screen.getByTestId("legend-variable")).toHaveTextContent("Nwt");
    expect(screen.getByTestId("legend-units")).toHaveTextContent("mm");
  });

  it("orders a glTF legend as dataset, variable, color scale, units, time step", () => {
    const dataset = { ...makeTimeSeriesMesh(), attributes: { color_ramp: "viridis" } };
    const variable = { ...dataset.viz.variables[0], label: "Soil moisture", units: "% saturation" };
    renderCard({ dataset, uniqueId: "Mu", legendUrls: [variable.timesteps[0].legend], subtitle: variable.timesteps[0].time, variable });
    const ids = ["legend-owner", "legend-variable", "gltf-legend", "legend-units", "legend-subtitle"];
    const els = ids.map((id) => screen.getByTestId(id));
    const inOrder = els.slice(1).map((el, i) => Boolean(els[i].compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING));
    expect(inOrder).toEqual([true, true, true, true]);
    expect(screen.queryByTestId("legend-realization")).not.toBeInTheDocument();
    expect(screen.getByTestId("legend-owner")).toHaveTextContent("Time-Integrated Variable Output");
    expect(screen.getByTestId("legend-variable")).toHaveTextContent("Soil moisture");
    expect(screen.queryByTestId("gltf-legend-title")).not.toBeInTheDocument();
    expect(screen.getByTestId("legend-units")).toHaveTextContent("% saturation");
    expect(screen.getByTestId("legend-subtitle")).toHaveTextContent("UTC");
  });

  it("writes only the dataset name when the id is not a layer (bare TIN, station data)", () => {
    const mesh = makeStaticMesh();
    const { unmount } = renderCard({ dataset: mesh, uniqueId: mesh.id, variable: mesh.viz.variables[0] });
    expect(screen.getByTestId("legend-owner")).toHaveTextContent("Mesh");
    expect(screen.getByTestId("legend-variable")).toHaveTextContent("Elevation");
    unmount();
    renderCard({ dataset: { ...mesh, viz: { ...mesh.viz, type: "czml", variables: undefined } }, uniqueId: mesh.id });
    expect(screen.getByTestId("legend-owner")).toHaveTextContent("Mesh");
    expect(screen.queryByTestId("legend-variable")).not.toBeInTheDocument();
  });
});

describe("picking the variable on the legend", () => {
  it("shows the variable the legend is for in a picker of the layer's variables", () => {
    const dataset = makeValueLayer(); // Nwt_mm and Srf_mm
    renderCard({ dataset, uniqueId: "Nwt_mm" });
    expect(screen.getByLabelText("Variable")).toBeInTheDocument();
    expect(screen.getByTestId("legend-variable")).toHaveTextContent("Nwt");
  });

  it("selects the picked variable on the map and hands it the clock when it varies in time", async () => {
    const dataset = makeValueLayer();
    const { setCZMLLayer, setActiveTimeSeries } = renderCard({ dataset, uniqueId: "Nwt_mm" });
    await select(screen.getByLabelText("Variable"), /Srf/, { container: document.body });
    expect(setCZMLLayer).toHaveBeenCalledWith(dataset.id, "Srf_mm");
    expect(setActiveTimeSeries).toHaveBeenCalledWith(
      expect.objectContaining({ datasetId: dataset.id, variableName: "Srf_mm" })
    );
  });

  it("picks a variable of a glTF mesh too", async () => {
    const dataset = makeTimeSeriesMesh(); // Mu and Nwt
    const { setCZMLLayer, setActiveTimeSeries } = renderCard({ dataset, uniqueId: "Mu", variable: dataset.viz.variables[0] });
    await select(screen.getByLabelText("Variable"), /Nwt/, { container: document.body });
    expect(setCZMLLayer).toHaveBeenCalledWith(dataset.id, "Nwt");
    expect(setActiveTimeSeries).toHaveBeenCalledWith(expect.objectContaining({ datasetId: dataset.id, variableName: "Nwt" }));
  });

  it("writes the variable's name without a picker when there is nothing to choose from", () => {
    const base = makeValueLayer();
    const dataset = { ...base, viz: { ...base.viz, variables: [base.viz.variables[0]] } };
    renderCard({ dataset, uniqueId: "Nwt_mm" });
    expect(screen.queryByLabelText("Variable")).not.toBeInTheDocument();
    expect(screen.getByTestId("legend-variable")).toHaveTextContent("Nwt");
  });
});
