import { render, screen } from "@testing-library/react";

import RunAction from "./RunAction";

it("Creates an Run button", () => {
  render(<RunAction />);
  const actionButton = screen.getByRole("button", { name: /Run/ });
  expect(actionButton).toBeInTheDocument();
});
