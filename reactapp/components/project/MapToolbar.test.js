import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { toast } from "react-toastify";

import { HOME } from "constants/GraphicsWindowConstants";
import {
  GraphicsWindowVisualsContext,
  LegendsContext,
  LegendsRegistryContext,
  ModalContext,
} from "react-tethys/context";
import MapToolbar from "./MapToolbar";

const TOOL_NAMES = ["Set Home Extent", "Zoom to Home", "Legends", "Open Workflows"];

function renderToolbar({ showLegends = false, framedObject = {} } = {}) {
  const spies = {
    setWorkflowsModal: jest.fn(),
    setShowLegends: jest.fn(),
    setUpdateFrame: jest.fn(),
    setZoomToExtent: jest.fn(),
  };
  render(
    <ModalContext.Provider value={{ setWorkflowsModal: spies.setWorkflowsModal }}>
      <LegendsRegistryContext.Provider value={{ setShowLegends: spies.setShowLegends, registerLegend: jest.fn(), unregisterLegend: jest.fn() }}>
        <LegendsContext.Provider value={{ showLegends, legends: {} }}>
          <GraphicsWindowVisualsContext.Provider
            value={{ setUpdateFrame: spies.setUpdateFrame, setZoomToExtent: spies.setZoomToExtent, framedObject }}
          >
            <MapToolbar />
          </GraphicsWindowVisualsContext.Provider>
        </LegendsContext.Provider>
      </LegendsRegistryContext.Provider>
    </ModalContext.Provider>
  );
  return spies;
}

beforeEach(() => toast.error.mockClear());

it("floats centered over the map with the four tools in order, each with a tooltip and no native title", async () => {
  const user = userEvent.setup();
  renderToolbar();
  const toolbar = screen.getByRole("toolbar", { name: "Map tools" });
  expect(toolbar).toHaveStyle({ position: "absolute", left: "50%", transform: "translateX(-50%)" });
  const names = screen.getAllByRole("button").map((button) => button.getAttribute("aria-label"));
  expect(names).toEqual(TOOL_NAMES);
  for (const name of TOOL_NAMES) {
    const button = screen.getByRole("button", { name });
    expect(button).not.toHaveAttribute("title");
    await user.hover(button);
    expect(await screen.findByRole("tooltip")).toBeInTheDocument();
    await user.unhover(button);
  }
});

it("sets the home extent from the current view", async () => {
  const user = userEvent.setup();
  const { setUpdateFrame } = renderToolbar();
  await user.click(screen.getByRole("button", { name: "Set Home Extent" }));
  expect(setUpdateFrame).toHaveBeenCalledWith(true);
});

it("zooms to the home extent when one is set", async () => {
  const user = userEvent.setup();
  const { setZoomToExtent } = renderToolbar({ framedObject: { [HOME]: [-1, -1, 1, 1] } });
  await user.click(screen.getByRole("button", { name: "Zoom to Home" }));
  expect(setZoomToExtent).toHaveBeenCalledWith(HOME);
  expect(toast.error).not.toHaveBeenCalled();
});

it("shows an error instead of zooming when no home extent is set", async () => {
  const user = userEvent.setup();
  const { setZoomToExtent } = renderToolbar({ framedObject: {} });
  await user.click(screen.getByRole("button", { name: "Zoom to Home" }));
  expect(setZoomToExtent).not.toHaveBeenCalled();
  expect(toast.error).toHaveBeenCalledWith("Home Extent has not been set yet", expect.any(Object));
});

it("switches the global legends on", async () => {
  const user = userEvent.setup();
  const { setShowLegends } = renderToolbar({ showLegends: false });
  const legendsButton = screen.getByRole("button", { name: "Legends" });
  expect(legendsButton).toHaveAttribute("aria-pressed", "false");
  await user.hover(legendsButton);
  expect(await screen.findByRole("tooltip")).toHaveTextContent("Show Legends");
  await user.click(legendsButton);
  expect(setShowLegends).toHaveBeenCalledWith(true);
});

it("shows the legends button pressed while the legends are on, and switches them off", async () => {
  const user = userEvent.setup();
  const { setShowLegends } = renderToolbar({ showLegends: true });
  const legendsButton = screen.getByRole("button", { name: "Legends" });
  expect(legendsButton).toHaveAttribute("aria-pressed", "true");
  await user.hover(legendsButton);
  expect(await screen.findByRole("tooltip")).toHaveTextContent("Hide Legends");
  await user.click(legendsButton);
  expect(setShowLegends).toHaveBeenCalledWith(false);
});

it("opens the workflows modal", async () => {
  const user = userEvent.setup();
  const { setWorkflowsModal } = renderToolbar();
  await user.click(screen.getByRole("button", { name: "Open Workflows" }));
  expect(setWorkflowsModal).toHaveBeenCalledWith(true);
});
