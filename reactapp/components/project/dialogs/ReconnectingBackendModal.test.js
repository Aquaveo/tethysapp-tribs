import { render, screen } from "@testing-library/react";

import ReconnectingModal from "./ReconnectingBackendModal";

it("Creates a modal dialog that doesn't show as default", () => {
  render(<ReconnectingModal />);
  const modal = screen.queryByRole("dialog");
  expect(modal).not.toBeInTheDocument();
});

it("Creates a modal dialog", () => {
  render(<ReconnectingModal show />);
  const modal = screen.getByRole("dialog");
  expect(modal).toBeInTheDocument();
});

it("Creates a modal dialog with heading displaying title given", () => {
  render(<ReconnectingModal show title="Foo" />);
  const modal = screen.getByRole("dialog");
  const title = screen.getByRole("heading", { name: /Foo/ });
  expect(modal).toContainElement(title);
});
