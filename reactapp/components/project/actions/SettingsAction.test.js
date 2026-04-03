import { render, screen } from "@testing-library/react";

import SettingsAction from "./SettingsAction";

it("Creates an Run button", () => {
  render(<SettingsAction />);
  const actionButton = screen.getByRole("button", { name: /Settings/ });
  expect(actionButton).toBeInTheDocument();
});
