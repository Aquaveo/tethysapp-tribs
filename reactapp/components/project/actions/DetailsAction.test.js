import { render, screen } from "@testing-library/react";

import DetailsAction from "./DetailsAction";

it("Creates an Details button", () => {
  render(<DetailsAction />);
  const actionButton = screen.getByRole("button", { name: /Details/ });
  expect(actionButton).toBeInTheDocument();
});
