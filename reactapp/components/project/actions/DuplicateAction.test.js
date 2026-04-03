import { render, screen } from "@testing-library/react";

import DuplicateAction from "./DuplicateAction";

it("Creates a Duplicate button", () => {
  render(<DuplicateAction />);
  const actionButton = screen.getByRole("button", { name: /Duplicate/ });
  expect(actionButton).toBeInTheDocument();
});
