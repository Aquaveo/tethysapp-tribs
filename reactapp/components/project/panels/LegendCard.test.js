import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { select } from "react-select-event";

import { GraphicsWindowVisualsContext } from "react-tethys/context";
import { makeMrfDataset, makeStaticMesh, makeTimeSeriesMesh } from "config/tests/mocks/meshMock";
import LegendCard from "./LegendCard";

function renderCard({ dataset, colorRamps = {}, ...props }) {
  const setColorRamp = jest.fn();
  const onColorRampChange = jest.fn();
  const utils = render(
    <GraphicsWindowVisualsContext.Provider value={{ colorRamps, setColorRamp }}>
      <LegendCard dataset={dataset} onColorRampChange={onColorRampChange} {...props} />
    </GraphicsWindowVisualsContext.Provider>
  );
  return { ...utils, setColorRamp, onColorRampChange };
}

beforeEach(() => {
  process.env.TETHYS_MEDIA_URL = "/media/";
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
