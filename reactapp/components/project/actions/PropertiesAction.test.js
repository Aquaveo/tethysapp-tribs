import { render, screen } from "@testing-library/react";

import PropertiesAction from "./PropertiesAction";

it("Creates a Properties button", () => {
  render(<PropertiesAction />);
  const actionButton = screen.getByRole("button", { name: /Properties/ });
  expect(actionButton).toBeInTheDocument();
});
