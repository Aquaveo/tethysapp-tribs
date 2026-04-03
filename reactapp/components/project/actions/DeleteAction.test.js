import { render, screen } from "@testing-library/react";

import DeleteAction from "./DeleteAction";

it("Creates a Delete button", () => {
  render(<DeleteAction />);
  const actionButton = screen.getByRole("button", { name: /Delete/ });
  expect(actionButton).toBeInTheDocument();
});
