import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";

import CollapseToggleButton from "./CollapseToggleButton";

const initAndRender = ({ open, openedTitle, closedTitle } = {}) => {
  const user = userEvent.setup();
  const clickCallback = jest.fn();
  render(
    <CollapseToggleButton
      open={open}
      openedTitle={openedTitle}
      closedTitle={closedTitle}
      onClick={clickCallback}
    />
  );
  return { user, clickCallback };
};

it("Creates a toggle button in the 'open' that defaults to the open state", () => {
  initAndRender();
  const collapseToggleButton = screen.getByRole("button", { name: /Shrink/ });
  expect(collapseToggleButton).toBeInTheDocument();
});

it("Creates a button labeled 'Shrink' when open", () => {
  initAndRender({ open: true });
  const collapseToggleButton = screen.getByRole("button", { name: /Shrink/ });
  expect(collapseToggleButton).toBeInTheDocument();
});

it("Creates a button labeled 'Expand' when not open", () => {
  initAndRender({ open: false });
  const collapseToggleButton = screen.getByRole("button", { name: /Expand/ });
  expect(collapseToggleButton).toBeInTheDocument();
});

it("Creates a button labeled with openedTitle prop when open", () => {
  initAndRender({ open: true, openedTitle: "Opened" });
  const collapseToggleButton = screen.getByRole("button", { name: /Opened/ });
  expect(collapseToggleButton).toBeInTheDocument();
});

it("Creates a button labeled with closedTitle prop when not open", () => {
  initAndRender({ open: false, closedTitle: "Closed" });
  const collapseToggleButton = screen.getByRole("button", { name: /Closed/ });
  expect(collapseToggleButton).toBeInTheDocument();
});

it("Calls the click callback when clicked", async () => {
  const { user, clickCallback } = initAndRender();
  const collapseToggleButton = screen.getByRole("button");
  await user.click(collapseToggleButton);
  expect(clickCallback).toHaveBeenCalled();
});
