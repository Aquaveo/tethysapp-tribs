import { render, screen } from "@testing-library/react";
import { select } from "react-select-event";

import { GraphicsWindowVisualsContext, SidePanelContext } from "react-tethys/context";
import { makeStaticMesh, makeTimeSeriesMesh } from "config/tests/mocks/meshMock";
import LegendPanel from "./LegendPanel";

const PANEL_ID = "legend-panel-test";

function renderPanel({ dataset, colorRamps = {}, ...props }) {
  const setColorRamp = jest.fn();
  const onColorRampChange = jest.fn();
  const utils = render(
    <GraphicsWindowVisualsContext.Provider value={{ colorRamps, setColorRamp }}>
      <SidePanelContext.Provider value={{ hideSidePanel: jest.fn(), visibleSidePanel: [PANEL_ID] }}>
        <LegendPanel dataset={dataset} panelId={PANEL_ID} onColorRampChange={onColorRampChange} {...props} />
      </SidePanelContext.Provider>
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
  renderPanel({
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
  renderPanel({ dataset, uniqueId: "Nwt", legendUrls: [variable.timesteps[0].legend], variable });
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
  renderPanel({ dataset, uniqueId: dataset.id, variable, colorRamps: { [dataset.id]: "turbo" } });
  expect(screen.getByText("Turbo")).toBeInTheDocument();
  expect(screen.queryAllByTestId("gltf-legend-tick")).toHaveLength(0);
  expect(screen.getByTestId("gltf-legend-note")).toBeInTheDocument();
});

it("applies a newly chosen ramp right away and saves it on the dataset", async () => {
  const dataset = makeStaticMesh();
  const { setColorRamp, onColorRampChange } = renderPanel({
    dataset,
    uniqueId: dataset.id,
    variable: dataset.viz.variables[0],
  });
  // The menu is portaled to document.body so the slide sheet does not clip it. (Not wrapped in act: the helper
  // waits for the menu, and an outer act would hold back the DOM updates it waits for.)
  await select(screen.getByLabelText("Color ramp"), "Plasma", { container: document.body });
  expect(setColorRamp).toHaveBeenCalledWith(dataset.id, "plasma");
  expect(onColorRampChange).toHaveBeenCalledWith("plasma");
});

it("offers no ramp selector for other visualization types", () => {
  const dataset = {
    ...makeStaticMesh(),
    viz: { type: "wms", legend: ["http://host/geoserver/wms?REQUEST=GetLegendGraphic&LAYER=x_y"] },
  };
  renderPanel({ dataset, uniqueId: "y" });
  expect(screen.queryByLabelText("Color ramp")).not.toBeInTheDocument();
  expect(screen.getByRole("img")).toBeInTheDocument();
});
