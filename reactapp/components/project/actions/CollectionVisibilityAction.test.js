import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";

import CollectionVisibilityAction from "./CollectionVisibilityAction";

it("Creates a button named Visible by default", () => {
  render(<CollectionVisibilityAction />);
  const visibilityButton = screen.getByRole("button", { name: /Collection Visible/ });
  expect(visibilityButton).toBeInTheDocument();
});

it("Creates a button named Hidden by default when off", () => {
  render(<CollectionVisibilityAction off />);
  const visibilityButton = screen.getByRole("button", { name: /Collection Hidden/ });
  expect(visibilityButton).toBeInTheDocument();
});

it("Toggles from Visible to Hidden when clicked", async () => {
  const user = userEvent.setup();
  render(<CollectionVisibilityAction />);
  await user.click(screen.getByRole("button", { name: /Collection Visible/ }));
  const visibilityButton = await screen.findByRole("button", {
    name: /Collection Hidden/,
  });
  expect(visibilityButton).toBeInTheDocument();
});

it("Toggles from Hidden to Visible when clicked when starts off", async () => {
  const user = userEvent.setup();
  render(<CollectionVisibilityAction off />);
  await user.click(screen.getByRole("button", { name: /Collection Hidden/ }));
  const visibilityButton = await screen.findByRole("button", {
    name: /Collection Visible/,
  });
  expect(visibilityButton).toBeInTheDocument();
});

it("Calls bound callback passing on parameter as false when not off", async () => {
  const mockCallback = jest.fn();
  const user = userEvent.setup();
  render(<CollectionVisibilityAction onClick={mockCallback} />);
  await user.click(screen.getByRole("button", { name: /Collection Visible/ }));
  const toggledButton = await screen.findByRole("button", { name: /Collection Hidden/ });
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
  render(<CollectionVisibilityAction off onClick={mockCallback} />);
  await user.click(screen.getByRole("button", { name: /Collection Hidden/ }));
  const toggledButton = await screen.findByRole("button", { name: /Collection Visible/ });
  expect(mockCallback).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "click",
      target: toggledButton,
    }),
    true
  );
});
