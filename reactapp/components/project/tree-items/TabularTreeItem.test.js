import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";

import TabularTreeItem from "./TabularTreeItem";
import { makeMesh } from "config/tests/mocks/meshMock";

function initAndRender() {
  const user = userEvent.setup();
  const tabular = makeMesh("Some Raster");
  const deleteCallback = jest.fn();
  const duplicateCallback = jest.fn();
  const updateCallback = jest.fn();
  const TabularRender = (
    <TabularTreeItem
      tabular={tabular}
      onDelete={deleteCallback}
      onDuplicate={duplicateCallback}
      onUpdate={updateCallback}
    />
  );
  const { rerender } = render(TabularRender);

  return {
    user,
    rerender,
    tabular,
    TabularRender,
    deleteCallback,
    updateCallback,
    duplicateCallback
  };
}


it("Creates a tree item with delete, and rename actions in options menu", async () => {
  const { user } = initAndRender();
  const optionsButton = screen.getByRole("button", { name: /Options/ });
  expect(optionsButton).toBeInTheDocument();
  await user.click(optionsButton);
  const deleteButton = await screen.findByRole("button", { name: /Delete/ });
  const renameButton = await screen.findByRole("button", { name: /Rename/ });
  expect(deleteButton).toBeVisible();
  expect(renameButton).toBeVisible();
});

it("Calls graphics delete and delete callback when delete button pressed", async () => {
  const { user, deleteCallback, rerender, TabularRender } = initAndRender();
  const optionsButton = screen.getByRole("button", { name: /Options/ });
  await user.click(optionsButton);
  const deleteButton = await screen.findByRole("button", { name: /Delete/ });
  await user.click(deleteButton);

  await rerender(TabularRender);
  const confirmDelete = screen.getByRole("button", { name: "Yes" })
  await user.click(confirmDelete);

  expect(deleteCallback).toHaveBeenCalled();
});

it("Opens and then closes the Confirm Delete modal", async () => {
  const { user, rerender, TabularRender } = initAndRender();
  const optionsButton = screen.getByRole("button", { name: /Options/ });
  await user.click(optionsButton);
  const deleteButton = await screen.findByRole("button", { name: /Delete/ });
  await user.click(deleteButton);

  await rerender(TabularRender);
  const deleteModal = screen.getByText("Confirm Delete");
  expect(deleteModal).toBeInTheDocument();
  const confirmDelete = screen.getByRole("button", { name: "Yes" });
  expect(confirmDelete).toBeInTheDocument();
  const cancelDelete = screen.getByRole("button", { name: "No" });
  expect(cancelDelete).toBeInTheDocument();
  await user.click(cancelDelete);

  await rerender(TabularRender);
  expect(deleteModal).not.toBeInTheDocument();
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
