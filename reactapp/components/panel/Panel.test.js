import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";

import Panel from "./Panel";

it("Has a default title of Panel", async () => {
  render(<Panel />);
  const panelTitle = await screen.findByText(/Panel/);
  expect(panelTitle).toBeInTheDocument();
});

it("Has configurable title", async () => {
  render(<Panel title="An Awesome Title" />);
  const panelTitle = await screen.findByText(/An Awesome Title/);
  expect(panelTitle).toBeInTheDocument();
});

it("Has collapse button labeled Shrink", async () => {
  render(
    <Panel>
      <p>Panel content.</p>
    </Panel>
  );
  const collapseButton = await screen.findByRole("button", { name: /Shrink/ });
  expect(collapseButton).toBeInTheDocument();
});

it("Has collapse button labeled Expand when closed", async () => {
  render(
    <Panel closed>
      <p>Panel content.</p>
    </Panel>
  );
  const collapseButton = await screen.findByRole("button", { name: /Expand/ });
  expect(collapseButton).toBeInTheDocument();
});

it("Has collapse button labeled Expand after toggle", async () => {
  const user = userEvent.setup();
  render(
    <Panel>
      <p>Panel content.</p>
    </Panel>
  );
  const collapseButton = await screen.findByRole("button", { name: /Shrink/ });
  user.click(collapseButton);
  const expandButton = await screen.findByRole("button", { name: /Expand/ });
  expect(expandButton).toBeInTheDocument();
});

it("Has back button labeled Go to Projects List", async () => {
  const user = userEvent.setup();
  render(
    <Panel isProject>
      <p>Panel content.</p>
    </Panel>
  );
  const backButton = await screen.findByRole("button", { name: /Go to Projects List/ });

  user.click(backButton);
});

it("Has visible content initially.", async () => {
  render(
    <Panel>
      <p>Panel content.</p>
    </Panel>
  );
  const content = await screen.findByText(/Panel content\./);
  expect(content).toBeVisible();
});

it("Displays absolutely from left by default", () => {
  render(
    <Panel>
      <p>Panel content.</p>
    </Panel>
  );
  const panel = screen.getByTestId("panel-wrapper");
  const panelStyle = window.getComputedStyle(panel);
  expect(panelStyle.position).toBe("absolute");
  expect(panelStyle.left).toBe("10px");
});

it("Displays absolutely from left when placement set to left", () => {
  render(
    <Panel placement="left">
      <p>Panel content.</p>
    </Panel>
  );
  const panel = screen.getByTestId("panel-wrapper");
  const panelStyle = window.getComputedStyle(panel);
  expect(panelStyle.position).toBe("absolute");
  expect(panelStyle.left).toBe("10px");
});

it("Displays absolutely from right when placement set to right", () => {
  render(
    <Panel placement="right">
      <p>Panel content.</p>
    </Panel>
  );
  const panel = screen.getByTestId("panel-wrapper");
  const panelStyle = window.getComputedStyle(panel);
  expect(panelStyle.position).toBe("absolute");
  expect(panelStyle.right).toBe("10px");
});

it("Displays absolutely from left with any other value of placement", () => {
  // Override console error to catch the prop type warning
  const originalError = console.error;
  console.error = (...args) => {
    // Make sure we are getting the correct error and not any others
    expect(args).toContain(
      'Invalid prop `placement` of value `bottom` supplied to `Panel`, expected one of ["left","right"].'
    );
  };

  render(
    <Panel placement="bottom">
      <p>Panel content.</p>
    </Panel>
  );
  const panel = screen.getByTestId("panel-wrapper");
  const panelStyle = window.getComputedStyle(panel);
  expect(panelStyle.position).toBe("absolute");
  expect(panelStyle.left).toBe("10px");

  // Restore console error
  console.error = originalError;
});

it("Gives both project header buttons a tooltip", async () => {
  const user = userEvent.setup();
  render(
    <Panel isProject>
      <p>Panel content.</p>
    </Panel>
  );
  for (const name of ["Go to Projects List", "Shrink"]) {
    const button = screen.getByRole("button", { name });
    expect(button).not.toHaveAttribute("title"); // no second, native tooltip
    await user.hover(button);
    expect(await screen.findByRole("tooltip")).toBeInTheDocument();
    await user.unhover(button);
  }
});

it("Has no map tool buttons: those live in the map toolbar", () => {
  render(
    <Panel isProject>
      <p>Panel content.</p>
    </Panel>
  );
  const names = screen.getAllByRole("button").map((button) => button.getAttribute("aria-label"));
  expect(names).toEqual(["Go to Projects List", "Shrink"]);
});
