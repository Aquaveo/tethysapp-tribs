import { render, screen } from "@testing-library/react";

import RenameAction from "./RenameAction";

it("Creates a Rename button", () => {
  render(<RenameAction />);
  const actionButton = screen.getByRole("button", { name: /Rename/ });
  expect(actionButton).toBeInTheDocument();
});
