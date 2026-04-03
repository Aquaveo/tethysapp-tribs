import { render, screen } from "@testing-library/react";

import AddAction from "./AddAction";

it("Creates an Add button", () => {
  render(<AddAction />);
  const actionButton = screen.getByRole("button", { name: /Add/ });
  expect(actionButton).toBeInTheDocument();
});
