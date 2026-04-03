import { render, screen } from "@testing-library/react";

import FrameAction from "./FrameAction";

it("Creates a Frame button", () => {
  render(<FrameAction />);
  const actionButton = screen.getByRole("button", { name: /Frame/ });
  expect(actionButton).toBeInTheDocument();
});
