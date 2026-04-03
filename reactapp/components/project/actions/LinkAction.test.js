import { render, screen } from "@testing-library/react";

import LinkAction from "./LinkAction";

it("Creates a Link button", () => {
  render(<LinkAction />);
  const actionButton = screen.getByRole("button", { name: /Add Link/ });
  expect(actionButton).toBeInTheDocument();
});
