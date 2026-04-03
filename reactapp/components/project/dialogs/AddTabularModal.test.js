import userEvent from "@testing-library/user-event";
import { AppContext } from "react-tethys/context";
import { render, screen, waitFor } from "@testing-library/react";

import AddTabularModal from "./AddTabularModal";

it("Creates a modal dialog", () => {
  render(
    <AppContext.Provider value={{ csrf: "12345" }}>
      <AddTabularModal show />
    </AppContext.Provider>
  );
  const modal = screen.getByRole("dialog");
  expect(modal).toBeInTheDocument();
});

it("Creates correct title for the modal dialog", () => {
  render(
    <AppContext.Provider value={{ csrf: "12345" }}>
      <AddTabularModal show />
    </AppContext.Provider>
  );
  const modal = screen.getByRole("dialog");
  const title = screen.getByRole("heading", { name: /Add Tabular/ });
  expect(modal).toContainElement(title);
});

it("Calls the close callback when close button is pressed", async () => {
  const user = userEvent.setup();
  const mockCallback = jest.fn();
  render(
    <AppContext.Provider value={{ csrf: "12345" }}>
      <AddTabularModal show onClose={mockCallback} />
    </AppContext.Provider>
  );
  const closeButton = screen.getByRole("button", { name: /Close/ });
  await user.click(closeButton);
  expect(mockCallback).toHaveBeenCalled();
});

it("Calls the close callback when cancel button is pressed", async () => {
  const user = userEvent.setup();
  const mockCallback = jest.fn();
  render(
    <AppContext.Provider value={{ csrf: "12345" }}>
      <AddTabularModal show onClose={mockCallback} />
    </AppContext.Provider>
  );
  const cancelButton = screen.getByRole("button", { name: /Cancel/ });
  await user.click(cancelButton);
  expect(mockCallback).toHaveBeenCalled();
});

it("Creates submit button with correct title in the modal dialog", () => {
  render(
    <AppContext.Provider value={{ csrf: "12345" }}>
      <AddTabularModal show />
    </AppContext.Provider>
  );
  const modal = screen.getByRole("dialog");
  const submitButton = screen.getByRole("button", { name: /Add/ });
  expect(modal).toContainElement(submitButton);
});

it("Creates correct input fields in the modal dialog", () => {
  render(
    <AppContext.Provider value={{ csrf: "12345" }}>
      <AddTabularModal show />
    </AppContext.Provider>
  );
  const modal = screen.getByRole("dialog");
  const nameInput = screen.getByLabelText(/Name/);
  expect(modal).toContainElement(nameInput);
});

it("Shows all of the errors if all fields are empty after submitting", async () => {
  const user = userEvent.setup();
  render(
    <AppContext.Provider value={{ csrf: "12345" }}>
      <AddTabularModal show />
    </AppContext.Provider>
  );

  const invisibleFileError = screen.queryByText("Please select a valid geometry file (.stl, .gdf)");
  const invisibleNameError = screen.queryByText("Please provide a name for the Tabular Dataset.");
  const invisibleDatasetTypeError = screen.queryByText("Please provide a type for the Tabular Dataset.");

  // Validate initial state - expect not to be invalid
  expect(invisibleFileError).not.toBeInTheDocument(); // Some exist while others don't??
  expect(invisibleNameError).not.toBeInTheDocument();
  expect(invisibleDatasetTypeError).not.toBeInTheDocument();

  const submitButton = screen.getByRole("button", { name: /Add/ });
  await user.click(submitButton);

  const fileError = screen.getByText("Please select a valid geometry file (.stl, .gdf).");
  const nameError = screen.getByText("Please provide a name for the Tabular Dataset.");
  const datasetTypeError = screen.getByText("Please provide a type for the Tabular Dataset.");
  // Check if the inputs are now marked as invalid after an invalid form submission
  expect(fileError).toBeInTheDocument();
  expect(nameError).toBeInTheDocument();
  expect(datasetTypeError).toBeInTheDocument();
});

it("Calls submit and close callbacks when submit button pressed.", async () => {
  const user = userEvent.setup();
  const submitCallback = jest.fn();
  const closeCallback = jest.fn();
  render(
    <AddTabularModal onSubmit={submitCallback} onClose={closeCallback} show />
  );

  const someValues = [{ name: 'teresa teng' }];
  const str = JSON.stringify(someValues);
  const file = new File(["(⌐□_□)"], "chucknorris.png", { type: "image/png" });
  File.prototype.text = jest.fn().mockResolvedValueOnce(str);

  const fileInput = screen.getByLabelText(/File/);
  const nameInput = screen.getByLabelText(/Name/);
  const datasetTypeInput = screen.getByRole("combobox", { name: "Select Tabular Dataset Type"});
  const submitButton = screen.getByRole("button", { name: /Add/ });

  await user.upload(fileInput, file);
  expect(fileInput.files[0]).toBe(file);
  expect(fileInput.files).toHaveLength(1);
  expect(fileInput).toHaveValue("C:\\fakepath\\chucknorris.png");
  expect(nameInput).toHaveValue("chucknorris.png");

  await user.clear(nameInput);
  await user.type(nameInput, "Baz");
  expect(nameInput).toHaveValue("Baz");

  await user.selectOptions(datasetTypeInput, "TRIBS_MDF_RAIN_GAUGE");
  expect(datasetTypeInput).toHaveValue("TRIBS_MDF_RAIN_GAUGE");

  await user.click(submitButton);

  const invisibleFileError = screen.queryByText("Please select a valid geometry file (.stl, .gdf)");
  const invisibleNameError = screen.queryByText("Please provide a name for the Raster.");
  const invisibleDatasetTypeError = screen.queryByText("Please provide a type for the Raster.");

  // Validate initial state - expect not to be invalid
  expect(invisibleFileError).not.toBeInTheDocument();
  expect(invisibleNameError).not.toBeInTheDocument();
  expect(invisibleDatasetTypeError).not.toBeInTheDocument();

  const pauseFor = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds));
  await pauseFor(500);

  expect(submitCallback).toHaveBeenCalledWith({
    name: "Baz",
    files: fileInput.files,
    type: "TRIBS_MDF_RAIN_GAUGE",
    data: undefined,
  });
  expect(closeCallback).toHaveBeenCalled();
});

it("Sets name field based on name of file selected", async () => {
  const user = userEvent.setup();
  const file = new File(["foo"], "foo.stl", { type: "model/stl" });
  render(
    <AppContext.Provider value={{ csrf: "12345" }}>
      <AddTabularModal show />
    </AppContext.Provider>
  );
  const fileInput = screen.getByLabelText(/File/);
  await user.upload(fileInput, file);
  const nameInput = screen.getByLabelText(/Name/);
  expect(nameInput).toHaveValue("foo.stl");
});

it("Changes the Dataset Type dropdown", async () => {
  const user = userEvent.setup();
  render(
    <AppContext.Provider value={{ csrf: "12345" }}>
      <AddTabularModal show />
    </AppContext.Provider>
  );
  const datasetTypeInput = screen.getByRole("combobox", { name: "Select Tabular Dataset Type"});
  await user.selectOptions(datasetTypeInput, "TRIBS_MDF_HYDROMET_STATION");
  expect(datasetTypeInput).toHaveValue("TRIBS_MDF_HYDROMET_STATION");
});

it("Changes the Name Field", async () => {
  const user = userEvent.setup();
  render(
    <AppContext.Provider value={{ csrf: "12345" }}>
      <AddTabularModal show />
    </AppContext.Provider>
  );
  const nameInput = screen.getByLabelText(/Name/);
  await user.clear(nameInput);
  await user.type(nameInput, "Baz");
  expect(nameInput).toHaveValue("Baz");
});

it("Resets all fields when Cancel Button is clicked", async () => {
  const user = userEvent.setup();

  // render the component the first time to input some test values
  const { rerender } = render(
    <AppContext.Provider value={{ csrf: "12345" }}>
      <AddTabularModal show />
    </AppContext.Provider>
  );
  const nameInput = screen.getByLabelText(/Name/);
  await user.type(nameInput, "Baz");

  const cancelButton = screen.getByRole("button", { name: /Cancel/ });
  user.click(cancelButton);

  // unmount the component and wait for the Cancel button to disappear
  rerender(
    <AppContext.Provider value={{ csrf: "12345" }}>
      <AddTabularModal show={false} />
    </AppContext.Provider>
  );

  await waitFor(() => {
    expect(cancelButton).not.toBeInTheDocument();
  });

  // rerender the component to show up
  rerender(
    <AppContext.Provider value={{ csrf: "12345" }}>
      <AddTabularModal show />
    </AppContext.Provider>
  );

  await waitFor(() => {
    // Assert that the fields have all been reset
    expect(screen.getByLabelText(/Name/)).toHaveValue('');
  });
});
