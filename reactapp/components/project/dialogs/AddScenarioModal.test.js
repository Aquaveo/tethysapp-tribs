import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";

import AddScenarioModal from "./AddScenarioModal";

it("Creates a modal dialog", () => {
  render(<AddScenarioModal show />);
  const modal = screen.getByRole("dialog");
  expect(modal).toBeInTheDocument();
});

it("Creates correct title for the modal dialog", () => {
  render(<AddScenarioModal show />);
  const modal = screen.getByRole("dialog");
  const title = screen.getByRole("heading", { name: /Add Scenario/ });
  expect(modal).toContainElement(title);
});

it("Creates submit button with correct title in the modal dialog", () => {
  render(<AddScenarioModal show />);
  const modal = screen.getByRole("dialog");
  const submitButton = screen.getByRole("button", { name: /Add/ });
  expect(modal).toContainElement(submitButton);
});

it("Creates correct input fields in the modal dialog", () => {
  render(<AddScenarioModal show />);
  const modal = screen.getByRole("dialog");
  const nameInput = screen.getByLabelText(/Name/);
  expect(modal).toContainElement(nameInput);
});

it("Calls submit and close callbacks when submit button pressed.", async () => {
  const user = userEvent.setup();
  const submitCallback = jest.fn();
  const closeCallback = jest.fn();
  render(<AddScenarioModal onSubmit={submitCallback} onClose={closeCallback} show />);
  const nameInput = screen.getByLabelText(/Name/);
  const submitButton = screen.getByRole("button", { name: /Add/ });
  await user.clear(nameInput);
  await user.type(nameInput, "Baz");
  await user.click(submitButton);
  expect(submitCallback).toHaveBeenCalledWith({
    name: "Baz",
    file: "file",
    type: "stl",
    data: undefined,
  });
  expect(closeCallback).toHaveBeenCalled();
});

it("Resets all fields when Cancel Button is clicked", async () => {
  const user = userEvent.setup();

  // render the component the first time to input some test values
  const { rerender } = render(<AddScenarioModal show />);
  const nameInput = screen.getByLabelText(/Name/);
  await user.type(nameInput, "Baz");

  const cancelButton = screen.getByRole("button", { name: /Cancel/ });
  user.click(cancelButton);

  // unmount the component and wait for the Cancel button to disappear
  rerender(<AddScenarioModal show={false} />);

  await waitFor(() => {
    expect(cancelButton).not.toBeInTheDocument();
  });

  // rerender the component to show up
  rerender(<AddScenarioModal show />);

  await waitFor(() => {
    // Assert that the fields have all been reset
    expect(screen.getByLabelText(/Name/)).toHaveValue('');
  });
});

/**  This next part will be useful when the files button is fully implemented  */
// it("Sets name field based on name of file selected (.stl)", async () => {
//   const user = userEvent.setup();
//   const file = new File(["foo"], "foo.stl", { type: "model/stl" });
//   render(<AddScenarioModal show />);
//   const fileInput = screen.getByLabelText(/File/);
//   await user.upload(fileInput, file);
//   const nameInput = screen.getByLabelText(/Name/);
//   expect(nameInput.value).toEqual("foo");
// });

// it("Sets name field based on name of file selected (.gdf)", async () => {
//   const user = userEvent.setup();
//   const file = new File(["foo"], "foo.gdf", { type: "text/plain" });
//   render(<AddScenarioModal show />);
//   const fileInput = screen.getByLabelText(/File/);
//   await user.upload(fileInput, file);
//   const nameInput = screen.getByLabelText(/Name/);
//   expect(nameInput.value).toEqual("foo");
// });
