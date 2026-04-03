import { render, screen } from "@testing-library/react";

import RemoveAction from "./RemoveAction";

it("Creates a Remove button", () => {
  render(<RemoveAction />);
  const actionButton = screen.getByRole("button", { name: /Remove/ });
  expect(actionButton).toBeInTheDocument();
});
