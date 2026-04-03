import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";

import HistoryTreeItem from "./HistoryTreeItem";
import { makeWorkflow } from "config/tests/mocks/workflowMock";

function initAndRender() {
  const user = userEvent.setup();
  const historyItem = makeWorkflow("Soil Moisture");
  const deleteCallback = jest.fn();
  const duplicateCallback = jest.fn();
  const runWorkflowCallback = jest.fn();
  const updateCallback = jest.fn();

  const HistoryItemRender = (
    <HistoryTreeItem
      historyItem={historyItem}
      onDelete={deleteCallback}
      onDuplicate={duplicateCallback}
      onUpdate={updateCallback}
      runWorkflow={runWorkflowCallback}
      historyIndex={0}
    />
  )
  const { rerender } = render(HistoryItemRender);

  return {
    user,
    historyItem,
    rerender,
    HistoryItemRender,
    deleteCallback,
    updateCallback,
    duplicateCallback,
    runWorkflowCallback,
  };
}

it("Creates a tree item with delete, duplicate, rename, and run actions in options menu", async () => {
  const { user } = initAndRender();
  const optionsButton = screen.getByRole("button", { name: /Options/ });
  expect(optionsButton).toBeInTheDocument();
  await user.click(optionsButton);
  const deleteButton = await screen.findByRole("button", { name: /Delete/ });
  const duplicateButton = await screen.findByRole("button", { name: /Duplicate/ });
  const renameButton = await screen.findByRole("button", { name: /Rename/ });
  const runButton = await screen.findByRole("button", { name: /Run Soil Moisture/ });
  expect(deleteButton).toBeVisible();
  expect(duplicateButton).toBeVisible();
  expect(renameButton).toBeVisible();
  expect(runButton).toBeVisible();
});

it("Calls graphics delete and delete callback when delete button pressed", async () => {
  const { user, deleteCallback, rerender, HistoryItemRender } = initAndRender();
  const optionsButton = screen.getByRole("button", { name: /Options/ });
  await user.click(optionsButton);
  const deleteButton = await screen.findByRole("button", { name: /Delete/ });
  await user.click(deleteButton);

  await rerender(HistoryItemRender);
  const confirmDelete = screen.getByRole("button", { name: "Yes" })
  await user.click(confirmDelete);

  expect(deleteCallback).toHaveBeenCalled();
});

it("Calls update callback when rename save button pressed", async () => {
  const { user, updateCallback } = initAndRender();
  const optionsButton = screen.getByRole("button", { name: /Options/ });
  await user.click(optionsButton);
  const renameButton = await screen.findByRole("button", { name: /Rename/ });
  await user.click(renameButton);
  const renameTextbox = await screen.findByRole("textbox");
  const renameSave = await screen.findByRole("button", { name: /^Save$/ });
  await user.clear(renameTextbox);
  await user.type(renameTextbox, "New Name");
  await user.click(renameSave);
  expect(updateCallback).toHaveBeenCalled();
  const callArg = updateCallback.mock.calls[0][0];
  expect(callArg.name).toBe("New Name");
});

it("Calls duplicate callback when duplicate button pressed", async () => {
  const { user, duplicateCallback } = initAndRender();
  const optionsButton = screen.getByRole("button", { name: /Options/ });
  await user.click(optionsButton);
  const duplicateButton = await screen.findByRole("button", { name: /Duplicate/ });
  await user.click(duplicateButton);
  expect(duplicateCallback).toHaveBeenCalled();
});

it("Calls runWorkflow callback when run button pressed", async () => {
  const { user, runWorkflowCallback } = initAndRender();
  const runButton = await screen.findByRole("button", { name: /Run Soil Moisture/ });
  await user.click(runButton);
  expect(runWorkflowCallback).toHaveBeenCalled();
});
