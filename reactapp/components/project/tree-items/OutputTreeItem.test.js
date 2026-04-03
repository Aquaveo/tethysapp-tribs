import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";

import OutputTreeItem from "./OutputTreeItem";
import { makeWorkflow } from "config/tests/mocks/workflowMock";

function initAndRender() {
  const user = userEvent.setup();
  const dataset = makeWorkflow("Basin Tin");
  render(<OutputTreeItem history_item={dataset}/>);
  return {
    user,
    dataset,
  };
}

it("Creates a leaf tree item inside a tree item that can expanded or shrunk", () => {
  initAndRender();
  const title = screen.getByText(/Output:/);
  const outputItem = screen.getByText(/Basin Tin/);
  expect(title).toBeInTheDocument();
  expect(outputItem).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Expand/ })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Shrink/ })).toBeNull();
});
