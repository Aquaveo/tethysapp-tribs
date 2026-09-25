import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";

import DownloadAction from "./DownloadAction";

it("Creates a Download button", () => {
  render(<DownloadAction datasetId="abc-123" />);
  const actionButton = screen.getByRole("button", { name: /Download/ });
  expect(actionButton).toBeInTheDocument();
});

it("Navigates to the download_all endpoint when clicked", async () => {
  const user = userEvent.setup();
  const originalLocation = window.location;
  delete window.location;
  window.location = { href: "" };

  render(<DownloadAction datasetId="abc-123" />);
  const actionButton = screen.getByRole("button", { name: /Download/ });
  await user.click(actionButton);
  expect(window.location.href).toBe(
    "/apps/tribs/datasets/abc-123/details/files/?tab_action=download_all"
  );

  window.location = originalLocation;
});

it("Navigates to the realization download_all endpoint when clicked with a realizationId", async () => {
  const user = userEvent.setup();
  const originalLocation = window.location;
  delete window.location;
  window.location = { href: "" };

  render(<DownloadAction realizationId="abc-123" />);
  const actionButton = screen.getByRole("button", { name: /Download/ });
  await user.click(actionButton);
  expect(window.location.href).toBe(
    "/apps/tribs/realizations/abc-123/details/datasets/?tab_action=download_all"
  );

  window.location = originalLocation;
});

it("Navigates to the scenario download_all endpoint when clicked with a scenarioId", async () => {
  const user = userEvent.setup();
  const originalLocation = window.location;
  delete window.location;
  window.location = { href: "" };

  render(<DownloadAction scenarioId="abc-123" />);
  const actionButton = screen.getByRole("button", { name: /Download/ });
  await user.click(actionButton);
  expect(window.location.href).toBe(
    "/apps/tribs/scenarios/abc-123/details/datasets/?tab_action=download_all"
  );

  window.location = originalLocation;
});

it("Navigates to the download_layer endpoint when clicked with a layer", async () => {
  const user = userEvent.setup();
  const originalLocation = window.location;
  delete window.location;
  window.location = { href: "" };

  render(<DownloadAction datasetId="abc-123" layer="abc-123_0-5cm" />);
  const actionButton = screen.getByRole("button", { name: /Download/ });
  await user.click(actionButton);
  expect(window.location.href).toBe(
    "/apps/tribs/datasets/abc-123/details/files/?tab_action=download_layer&layer=abc-123_0-5cm"
  );

  window.location = originalLocation;
});

it("Does not navigate when no target id is provided", async () => {
  const user = userEvent.setup();
  const originalLocation = window.location;
  delete window.location;
  window.location = { href: "" };

  render(<DownloadAction />);
  const actionButton = screen.getByRole("button", { name: /Download/ });
  await user.click(actionButton);
  expect(window.location.href).toBe("");

  window.location = originalLocation;
});
