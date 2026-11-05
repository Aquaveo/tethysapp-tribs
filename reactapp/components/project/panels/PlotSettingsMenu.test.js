import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";

import PlotSettingsMenu from "./PlotSettingsMenu";

function renderMenu(props = {}) {
  const onYAxisScaleChange = jest.fn();
  const onToggleVariablesPanel = jest.fn();
  render(
    <div>
      <button type="button">Elsewhere</button>
      <PlotSettingsMenu
        yAxisScale="linear"
        onYAxisScaleChange={onYAxisScaleChange}
        variablesPanelOpen={false}
        onToggleVariablesPanel={onToggleVariablesPanel}
        {...props}
      />
    </div>
  );
  return { onYAxisScaleChange, onToggleVariablesPanel };
}

const gear = () => screen.getByRole("button", { name: "Plot settings" });
const scaleToggle = () => screen.getByText(/^Y Axis Scale:/);

it("opens from the gear and names the current y-axis scale", async () => {
  const user = userEvent.setup();
  renderMenu({ yAxisScale: "log" });
  expect(screen.queryByText(/Y Axis Scale/)).not.toBeInTheDocument();
  await user.click(gear());
  expect(gear()).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByText("Y Axis Scale: Log")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Open Variables Panel" })).toBeInTheDocument();
});

it("lists the scales in a submenu with the current one checked, and applies a choice", async () => {
  const user = userEvent.setup();
  const { onYAxisScaleChange } = renderMenu();
  await user.click(gear());
  expect(screen.queryByRole("menuitemradio")).not.toBeInTheDocument();
  await user.click(scaleToggle());
  const submenu = screen.getByRole("menu", { name: "Y Axis Scale: Linear" });
  const options = screen.getAllByRole("menuitemradio");
  expect(options.every((el) => submenu.contains(el))).toBe(true);
  expect(options.map((el) => el.textContent)).toEqual(["Linear", "Log", "Auto"]);
  expect(options.map((el) => el.getAttribute("aria-checked"))).toEqual(["true", "false", "false"]);
  expect(options.some((el) => el.hasAttribute("aria-selected"))).toBe(false);
  expect(gear()).toHaveAttribute("aria-expanded", "true"); // opening the submenu keeps the menu open
  await user.click(screen.getByRole("menuitemradio", { name: "Log" }));
  expect(onYAxisScaleChange).toHaveBeenCalledWith("log");
  // A choice closes the whole menu (closed menus stay mounted, so check the toggles' state)
  expect(gear()).toHaveAttribute("aria-expanded", "false");
  expect(scaleToggle()).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("menuitemradio")).not.toBeInTheDocument();
});

it("keeps the arrow keys moving through the outer menu after the submenu was opened and closed", async () => {
  const user = userEvent.setup();
  renderMenu();
  await user.click(gear());
  await user.click(scaleToggle());
  expect(screen.getAllByRole("menuitemradio")).toHaveLength(3);
  await user.click(scaleToggle()); // close the submenu again
  expect(scaleToggle()).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("menuitemradio")).not.toBeInTheDocument(); // so its items are out of the key order
  screen.getByRole("button", { name: "Open Variables Panel" }).focus();
  await user.keyboard("{ArrowUp}");
  expect(scaleToggle()).toHaveFocus();
  // Down on the (closed) submenu entry opens it with the first scale focused, as on any dropdown toggle
  await user.keyboard("{ArrowDown}");
  expect(scaleToggle()).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByRole("menuitemradio", { name: "Linear" })).toHaveFocus();
});

it("closes from a click elsewhere", async () => {
  const user = userEvent.setup();
  renderMenu();
  await user.click(gear());
  await user.click(scaleToggle());
  await user.click(screen.getByRole("button", { name: "Elsewhere" }));
  expect(gear()).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("menuitemradio")).not.toBeInTheDocument();
});

it("toggles the Variables panel and closes", async () => {
  const user = userEvent.setup();
  const { onToggleVariablesPanel } = renderMenu({ variablesPanelOpen: true });
  await user.click(gear());
  await user.click(screen.getByRole("button", { name: "Close Variables Panel" }));
  expect(onToggleVariablesPanel).toHaveBeenCalledTimes(1);
  expect(gear()).toHaveAttribute("aria-expanded", "false");
});
