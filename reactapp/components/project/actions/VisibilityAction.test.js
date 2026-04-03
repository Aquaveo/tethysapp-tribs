import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";

import VisibilityAction from "./VisibilityAction";

it("Creates a button named Visible by default", () => {
  render(<VisibilityAction />);
  const visibilityButton = screen.getByRole("button", { name: /Visible/ });
  expect(visibilityButton).toBeInTheDocument();
});

it("Creates a button named Hidden by default when off", () => {
  render(<VisibilityAction off />);
  const visibilityButton = screen.getByRole("button", { name: /Hidden/ });
  expect(visibilityButton).toBeInTheDocument();
});

it("Toggles from Visible to Hidden when clicked", async () => {
  const user = userEvent.setup();
  render(<VisibilityAction />);
  await user.click(screen.getByRole("button", { name: /Visible/ }));
  const visibilityButton = await screen.findByRole("button", {
    name: /Hidden/,
  });
  expect(visibilityButton).toBeInTheDocument();
});

it("Toggles from Hidden to Visible when clicked when starts off", async () => {
  const user = userEvent.setup();
  render(<VisibilityAction off />);
  await user.click(screen.getByRole("button", { name: /Hidden/ }));
  const visibilityButton = await screen.findByRole("button", {
    name: /Visible/,
  });
  expect(visibilityButton).toBeInTheDocument();
});

it("Calls bound callback passing on parameter as false when not off", async () => {
  const mockCallback = jest.fn();
  const user = userEvent.setup();
  render(<VisibilityAction onClick={mockCallback} />);
  await user.click(screen.getByRole("button", { name: /Visible/ }));
  const toggledButton = await screen.findByRole("button", { name: /Hidden/ });
  expect(mockCallback).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "click",
      target: toggledButton,
    }),
    false
  );
});

it("Calls bound callback passing on parameter as true when off", async () => {
  const mockCallback = jest.fn();
  const user = userEvent.setup();
  render(<VisibilityAction off onClick={mockCallback} />);
  await user.click(screen.getByRole("button", { name: /Hidden/ }));
  const toggledButton = await screen.findByRole("button", { name: /Visible/ });
  expect(mockCallback).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "click",
      target: toggledButton,
    }),
    true
  );
});
