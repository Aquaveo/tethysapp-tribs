import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";

import RealizationTreeItem from "./RealizationTreeItem";
import { makeRealization } from "config/tests/mocks/realizationMock";
import { ModalContext } from "react-tethys/context";
import { serialized_project } from "config/tests/mocks/projectContext";
import { filterDatasets } from "../utils/DatasetCreation";
import { DATASET_GROUPS } from "constants/projectConstants";

function initAndRender() {
  const user = userEvent.setup();
  const linked_datasets = serialized_project.scenarios[0].realizations[0].linked_datasets
  const realization = makeRealization("Basin Tin", linked_datasets);
  const outputDatasets = filterDatasets(serialized_project.datasets, DATASET_GROUPS.OTHER);
  const updateCallback = jest.fn();
  const openCallback = jest.fn();
  const deleteCallback = jest.fn();
  const updateDatasetCallback = jest.fn();
  const deleteDatasetCallback = jest.fn();
  const setRealizationCallback = jest.fn();
  const setShowRealizationModelControl = jest.fn();
  const RealizationRender = (
    <ModalContext.Provider value={{setShowRealizationModelControl}}>
      <RealizationTreeItem
        realization={realization}
        onUpdate={updateCallback}
        onDelete={deleteCallback}
        onDeleteDataset={deleteDatasetCallback}
        onUpdateDataset={updateDatasetCallback}
        outputDatasets={outputDatasets}
        openModelControl={openCallback}
        setRealizationIndex={setRealizationCallback}
        realizationIndex={0}
      />
    </ModalContext.Provider>
  )
  const { rerender } = render(RealizationRender);

  return {
    user,
    rerender,
    realization,
    RealizationRender,
    updateCallback,
    deleteCallback,
    openCallback,
    setRealizationCallback,
    setShowRealizationModelControl
  };
}

it("Creates a tree item with delete and rename actions in options menu", async () => {
  const { user } = initAndRender();
  const optionsButton = screen.getAllByRole("button", { name: /Options/ })[0];
  expect(optionsButton).toBeInTheDocument();
  await user.click(optionsButton);
  const deleteButton = await screen.findByRole("button", { name: /Delete/ });
  const renameButton = await screen.findByRole("button", { name: /Rename/ });
  expect(deleteButton).toBeVisible();
  expect(renameButton).toBeVisible();
});

it("Calls delete callback when delete button pressed", async () => {
  const { user, deleteCallback, rerender, RealizationRender } = initAndRender();
  const optionsButton = screen.getAllByRole("button", { name: /Options/ })[0];
  await user.click(optionsButton);
  const deleteButton = await screen.findByRole("button", { name: /Delete/ });
  await user.click(deleteButton);

  await rerender(RealizationRender);
  const confirmDelete = screen.getByRole("button", { name: "Yes" });
  await user.click(confirmDelete);

  expect(deleteCallback).toHaveBeenCalled();
});

it("Opens and then closes the Confirm Delete modal", async () => {
  const { user, rerender, RealizationRender } = initAndRender();
  const optionsButton = screen.getAllByRole("button", { name: /Options/ })[0];
  await user.click(optionsButton);
  const deleteButton = await screen.findByRole("button", { name: /Delete/ });
  await user.click(deleteButton);

  await rerender(RealizationRender);
  const deleteModal = screen.getByText("Confirm Delete");
  expect(deleteModal).toBeInTheDocument();
  const confirmDelete = screen.getByRole("button", { name: "Yes" });
  expect(confirmDelete).toBeInTheDocument();
  const cancelDelete = screen.getByRole("button", { name: "No" });
  expect(cancelDelete).toBeInTheDocument();
  await user.click(cancelDelete);

  await rerender(RealizationRender);
  expect(deleteModal).not.toBeInTheDocument();
});

it("Calls update callback when rename save button pressed", async () => {
  const { user, updateCallback } = initAndRender();
  const optionsButton = screen.getAllByRole("button", { name: /Options/ })[0];
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

it("Calls updateRealizationIndex callback when open modal button pressed", async () => {
  const { user, setRealizationCallback } = initAndRender();
  const settingsButton = screen.getByRole("button", { name: /Settings/ });
  await user.click(settingsButton);
  expect(setRealizationCallback).toHaveBeenCalled();
});
