import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";

import Panel from "./Panel";
import { ModalContext } from "react-tethys/context";

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

it("Opens the workflows Modal", async () => {
  const user = userEvent.setup();
  const setWorkflowsModal = jest.fn();
  render(
    <ModalContext.Provider value={{setWorkflowsModal}}>
      <Panel isProject>
        <p>Panel content.</p>
      </Panel>
    </ModalContext.Provider>
  );

  const workflowsButton = screen.getByRole("button", { name: "Open Workflows"});
  await user.click(workflowsButton);
  expect(setWorkflowsModal).toHaveBeenCalledWith(true);
});
