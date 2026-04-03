import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";

import ScenarioTreeItem from "./ScenarioTreeItem";
import { makeScenario } from "config/tests/mocks/scenarioMock";
import { ModalContext } from "react-tethys/context";

function initAndRender() {
  const user = userEvent.setup();
  const scenario = makeScenario("Basin Tin");
  const deleteCallback = jest.fn();
  const duplicateCallback = jest.fn();
  const updateCallback = jest.fn();
  const openCallback = jest.fn();
  const setScenarioCallback = jest.fn();
  const setShowAddGenericDataset = jest.fn();
  const ScenarioRender = (
    <ModalContext.Provider value={{setShowAddGenericDataset}}>
      <ScenarioTreeItem
        scenario={scenario}
        onDelete={deleteCallback}
        onDuplicate={duplicateCallback}
        onUpdate={updateCallback}
        openModelControl={openCallback}
        setScenarioIndex={setScenarioCallback}
      />
    </ModalContext.Provider>
  )
  const { rerender } = render(ScenarioRender);

  return {
    user,
    rerender,
    scenario,
    ScenarioRender,
    deleteCallback,
    updateCallback,
    duplicateCallback,
    openCallback,
    setScenarioCallback,
    setShowAddGenericDataset
  };
}

it("Creates a tree item with frame, delete, and rename actions in options menu", async () => {
  const { user } = initAndRender();
  const optionsButton = screen.getByRole("button", { name: /Options/ });
  expect(optionsButton).toBeInTheDocument();
  await user.click(optionsButton);
  const deleteButton = await screen.findByRole("button", { name: /Delete/ });
  const renameButton = await screen.findByRole("button", { name: /Rename/ });
  expect(deleteButton).toBeVisible();
  expect(renameButton).toBeVisible();
});

it("Calls delete callback when delete button pressed", async () => {
  const { user, deleteCallback, rerender, ScenarioRender } = initAndRender();
  const optionsButton = screen.getByRole("button", { name: /Options/ });
  await user.click(optionsButton);
  const deleteButton = await screen.findByRole("button", { name: /Delete/ });
  await user.click(deleteButton);

  await rerender(ScenarioRender);
  const confirmDelete = screen.getByRole("button", { name: "Yes" });
  await user.click(confirmDelete);

  expect(deleteCallback).toHaveBeenCalled();
});

it("Opens and then closes the Confirm Delete modal", async () => {
  const { user, rerender, ScenarioRender } = initAndRender();
  const optionsButton = screen.getByRole("button", { name: /Options/ });
  await user.click(optionsButton);
  const deleteButton = await screen.findByRole("button", { name: /Delete/ });
  await user.click(deleteButton);

  await rerender(ScenarioRender);
  const deleteModal = screen.getByText("Confirm Delete");
  expect(deleteModal).toBeInTheDocument();
  const confirmDelete = screen.getByRole("button", { name: "Yes" });
  expect(confirmDelete).toBeInTheDocument();
  const cancelDelete = screen.getByRole("button", { name: "No" });
  expect(cancelDelete).toBeInTheDocument();
  await user.click(cancelDelete);

  await rerender(ScenarioRender);
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

it("Calls updateScenarioIndex callback when duplicate button pressed", async () => {
  const { user, setScenarioCallback } = initAndRender();
  const settingsButton = screen.getByRole("button", { name: /Settings/ });
  await user.click(settingsButton);
  expect(setScenarioCallback).toHaveBeenCalled();
});
