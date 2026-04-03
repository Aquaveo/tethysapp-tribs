import userEvent from "@testing-library/user-event";
import Dropdown from "react-bootstrap/Dropdown";
import { render, screen } from "@testing-library/react";

import ContextMenu from "./ContextMenu";

it('Creates a menu toggle button titled "Menu"', () => {
  render(<ContextMenu />);
  const menuButton = screen.getByRole("button", { name: /Menu/ });
  expect(menuButton).toBeInTheDocument();
});

it("Creates a menu toggle button with given button title", () => {
  render(<ContextMenu buttonTitle="Click Me" />);
  const menuButton = screen.getByRole("button", { name: /Click Me/ });
  expect(menuButton).toBeInTheDocument();
});

it("Hides dropdown items when initially rendered.", () => {
  render(
    <ContextMenu>
      <Dropdown.Item>Foo</Dropdown.Item>
    </ContextMenu>
  );
  const dropdownItem = screen.queryByText("Foo");
  expect(dropdownItem).toBeNull();
});

it("Shows dropdown menu items when menu button clicked", async () => {
  const user = userEvent.setup();
  render(
    <ContextMenu>
      <Dropdown.Item>Foo</Dropdown.Item>
    </ContextMenu>
  );
  const menuButton = screen.getByRole("button", { name: /Menu/ });
  await user.click(menuButton);
  const dropdownItem = screen.queryByText("Foo");
  expect(dropdownItem).toBeInTheDocument();
});
