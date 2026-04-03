import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";

import ModelTreeItem from "./ModelTreeItem";
import newUUID from "lib/uuid";

function makeModel(name) {
  return {
    id: newUUID(),
    name,
    properties: {},
  };
}

function initAndRender(modelControl = false) {
  const user = userEvent.setup();
  const dataset = modelControl ? makeModel("Model Control") : makeModel("Basin Tin");
  const openCallback = jest.fn();
  const updateScenarioIndexCallback = jest.fn();
  render(
    <ModelTreeItem
      dataset={dataset}
      openModelControl={openCallback}
      updateScenarioIndex={updateScenarioIndexCallback}
    />
  );
  return {
    user,
    dataset,
    openCallback,
    updateScenarioIndexCallback
  };
}

it("Creates a leaf tree item with name of face for the model", () => {
  initAndRender();
  const title = screen.getByText(/Basin Tin/);
  expect(title).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Expand/ })).toBeNull();
  expect(screen.queryByRole("button", { name: /Shrink/ })).toBeNull();
});

it("Calls modelControl callback when Settings button pressed", async () => {
  const { user, openCallback, updateScenarioIndexCallback } = initAndRender(true);
  const settingsButton = screen.getByRole("button", { name: /Settings/ });
  await user.click(settingsButton);
  expect(openCallback).toHaveBeenCalled();
  expect(updateScenarioIndexCallback).toHaveBeenCalled();
});
