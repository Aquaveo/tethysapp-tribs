import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { select } from "react-select-event";

import { GraphicsWindowVisualsContext, LegendsContext, LegendsProvider, LegendsRegistryContext } from "react-tethys/context";
import { makeMrfDataset, makeStaticMesh } from "config/tests/mocks/meshMock";
import useLegendEntry from "hooks/useLegendEntry";
import LegendsPanel from "./LegendsPanel";

const visuals = { colorRamps: {}, setColorRamp: jest.fn() };

function renderPanel({ showLegends = true, legends = {} } = {}) {
  const setShowLegends = jest.fn();
  render(
    <GraphicsWindowVisualsContext.Provider value={visuals}>
      <LegendsRegistryContext.Provider value={{ registerLegend: jest.fn(), unregisterLegend: jest.fn(), setShowLegends }}>
        <LegendsContext.Provider value={{ showLegends, legends }}>
          <LegendsPanel />
        </LegendsContext.Provider>
      </LegendsRegistryContext.Provider>
    </GraphicsWindowVisualsContext.Provider>
  );
  return { setShowLegends };
}

const mrfEntry = (overrides = {}) => ({
  id: "mrf",
  order: [3, 0, 2],
  seq: 0,
  dataset: makeMrfDataset(),
  uniqueId: "MDGW",
  legendUrls: [makeMrfDataset().viz.legend[1]],
  realizationName: "Run 1",
  ...overrides,
});

const meshEntry = (overrides = {}) => {
  const dataset = makeStaticMesh();
  return { id: dataset.id, order: [0, 0, 0], seq: 1, dataset, uniqueId: dataset.id, variable: dataset.viz.variables[0], ...overrides };
};

beforeEach(() => {
  process.env.TETHYS_MEDIA_URL = "/media/";
  window.localStorage.clear();
});

it("is hidden until the legends are switched on", () => {
  renderPanel({ showLegends: false, legends: { mrf: mrfEntry() } });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("says so when no visible layer has a legend", () => {
  renderPanel();
  expect(screen.getByText("Legends")).toBeInTheDocument();
  expect(screen.getByTestId("legends-empty")).toHaveTextContent("No visible layers have a legend.");
  expect(screen.queryByTestId("legend-card")).not.toBeInTheDocument();
});

it("lists one card per registered legend in project-tree order", () => {
  const gis = { id: "gis", order: [1, 0, 0], seq: 2, dataset: { ...makeMrfDataset(), id: "gis", name: "Streams" }, uniqueId: "gis" };
  renderPanel({ legends: { mrf: mrfEntry(), gis, mesh: meshEntry() } }); // registered out of tree order
  const owners = screen.getAllByTestId("legend-owner").map((el) => el.textContent);
  expect(owners).toEqual(["Mesh", "Streams", "Basin Averages"]);
  expect(screen.getByTestId("legend-realization")).toHaveTextContent("Run 1");
  expect(screen.queryByTestId("legends-empty")).not.toBeInTheDocument();
});

it("closes through the sheet's close button", async () => {
  const user = userEvent.setup();
  const { setShowLegends } = renderPanel({ legends: { mrf: mrfEntry() } });
  await user.click(screen.getByRole("button", { name: "Close" }));
  expect(setShowLegends).toHaveBeenCalledWith(false);
});

it("passes a chosen ramp to the context and to the entry's callback", async () => {
  const onColorRampChange = jest.fn();
  const entry = meshEntry({ onColorRampChange });
  renderPanel({ legends: { [entry.id]: entry } });
  await select(screen.getByLabelText("Color ramp"), "Viridis", { container: document.body });
  expect(visuals.setColorRamp).toHaveBeenCalledWith(entry.dataset.id, "viridis");
  expect(onColorRampChange).toHaveBeenCalledWith("viridis");
});

describe("with layers registering through useLegendEntry", () => {
  const Registrar = (props) => {
    useLegendEntry(props);
    return null;
  };

  it("adds a card when a layer registers and drops it when the layer unregisters or unmounts", () => {
    window.localStorage.setItem("showLegends", "true");
    const mrf = makeMrfDataset();
    const mesh = makeStaticMesh();
    const tree = ({ meshActive = true, withMrf = true }) => (
      <GraphicsWindowVisualsContext.Provider value={visuals}>
        <LegendsProvider>
          {withMrf && <Registrar id="mrf" active order={[3, 0, 0]} dataset={mrf} uniqueId="MDGW" legendUrls={[mrf.viz.legend[1]]} realizationName="Run 1" />}
          <Registrar id={mesh.id} active={meshActive} order={[0, 0, 0]} dataset={mesh} uniqueId={mesh.id} variable={mesh.viz.variables[0]} />
          <LegendsPanel />
        </LegendsProvider>
      </GraphicsWindowVisualsContext.Provider>
    );
    const { rerender } = render(tree({}));
    expect(screen.getAllByTestId("legend-owner").map((el) => el.textContent)).toEqual(["Mesh", "Basin Averages"]);
    rerender(tree({ meshActive: false }));
    expect(screen.getAllByTestId("legend-owner").map((el) => el.textContent)).toEqual(["Basin Averages"]);
    rerender(tree({ meshActive: false, withMrf: false }));
    expect(screen.getByTestId("legends-empty")).toBeInTheDocument();
  });
});
