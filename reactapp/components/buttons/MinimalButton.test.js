import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";

import MinimalButton from "./MinimalButton";

it("Creates a button", () => {
  render(<MinimalButton>Some Button</MinimalButton>);
  const button = screen.getByRole("button", { name: /Some Button/ });
  expect(button).toBeInTheDocument();
});

it("Creates a Bootstrap button", () => {
  render(<MinimalButton>Some Button</MinimalButton>);
  const button = screen.getByRole("button", { name: /Some Button/ });
  expect(button.classList).toContain("btn");
  expect(button.classList).not.toContain("btn-sm");
});

it("Creates a small Bootstrap button when size is sm", () => {
  render(<MinimalButton size="sm">Some Button</MinimalButton>);
  const button = screen.getByRole("button", { name: /Some Button/ });
  expect(button.classList).toContain("btn");
  expect(button.classList).toContain("btn-sm");
});

it("Maintains bootstrap class when custom classes given", () => {
  render(
    <MinimalButton size="sm" className="custom-class another-class">
      Some Button
    </MinimalButton>
  );
  const button = screen.getByRole("button", { name: /Some Button/ });
  expect(button.classList).toContain("btn");
  expect(button.classList).toContain("btn-sm");
  expect(button.classList).toContain("custom-class");
  expect(button.classList).toContain("another-class");
});

it("Calls bound callback when clicked", async () => {
  const user = userEvent.setup();
  const mockCallback = jest.fn();
  render(<MinimalButton onClick={mockCallback}>Some Button</MinimalButton>);
  const button = screen.getByRole("button", { name: /Some Button/ });
  await user.click(button);
  expect(mockCallback).toHaveBeenCalled();
});
