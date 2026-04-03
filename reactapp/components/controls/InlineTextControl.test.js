import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";

import InlineTextControl from "./InlineTextControl";

it("Creates a text input control.", () => {
  render(<InlineTextControl />);
  const textInput = screen.getByRole("textbox");
  expect(textInput).toBeInTheDocument();
});

it("Creates save button.", () => {
  render(<InlineTextControl />);
  const saveButton = screen.getByRole("button", { name: /^Save$/ });
  expect(saveButton).toBeInTheDocument();
});

it("Creates cancel button.", () => {
  render(<InlineTextControl />);
  const cancelButton = screen.getByRole("button", { name: /Cancel/ });
  expect(cancelButton).toBeInTheDocument();
});

it("Calls the save callback when save button after typing is pressed.", async () => {
  const user = userEvent.setup();
  const mockCallback = jest.fn();
  render(<InlineTextControl onSave={mockCallback} />);
  const textInput = screen.getByRole("textbox");
  await user.type(textInput, "Foo");
  const saveButton = screen.getByRole("button", { name: /^Save$/ });
  await user.click(saveButton);
  expect(mockCallback).toHaveBeenCalledWith("Foo");
});

it("Calls the save callback when enter key is pressed.", async () => {
  const user = userEvent.setup();
  const mockCallback = jest.fn();
  render(<InlineTextControl onSave={mockCallback} />);
  const textInput = screen.getByRole("textbox");
  await user.type(textInput, "Foo");
  await user.keyboard("[Enter]");
  expect(mockCallback).toHaveBeenCalledWith("Foo");
});

it("Calls the save callback when numpad enter key is pressed.", async () => {
  const user = userEvent.setup();
  const mockCallback = jest.fn();
  render(<InlineTextControl onSave={mockCallback} />);
  const textInput = screen.getByRole("textbox");
  await user.type(textInput, "Foo");
  await user.keyboard("[NumpadEnter]");
  expect(mockCallback).toHaveBeenCalledWith("Foo");
});

it("Calls the save callback when save button is pressed with valid default value.", async () => {
  const user = userEvent.setup();
  const mockCallback = jest.fn();
  render(
    <InlineTextControl defaultValue="Foo" pattern="\w+" onSave={mockCallback} />
  );
  const saveButton = screen.getByRole("button", { name: /^Save$/ });
  await user.click(saveButton);
  expect(mockCallback).toHaveBeenCalledWith("Foo");
});

it("Calls the cancel callback when cancel button is pressed.", async () => {
  const user = userEvent.setup();
  const mockCallback = jest.fn();
  render(<InlineTextControl onCancel={mockCallback} />);
  const textInput = screen.getByRole("textbox");
  await user.type(textInput, "Foo");
  const cancelButton = screen.getByRole("button", { name: /Cancel/ });
  await user.click(cancelButton);
  expect(mockCallback).toHaveBeenCalled();
});

it("Calls the cancel callback when escape key is pressed.", async () => {
  const user = userEvent.setup();
  const mockCallback = jest.fn();
  render(<InlineTextControl onCancel={mockCallback} />);
  const textInput = screen.getByRole("textbox");
  await user.type(textInput, "Foo");
  await user.keyboard("[Escape]");
  expect(mockCallback).toHaveBeenCalled();
});

it("Does not call save callback when save button is pressed and text is invalid.", async () => {
  const user = userEvent.setup();
  const mockCallback = jest.fn();
  render(<InlineTextControl pattern="\w+" onSave={mockCallback} />);
  const textInput = screen.getByRole("textbox");
  await user.type(textInput, "Foo$%");
  const saveButton = screen.getByRole("button", { name: /^Save$/ });
  await user.click(saveButton);
  expect(mockCallback).not.toHaveBeenCalled();
});

it("Does not call save callback when enter key is pressed and text is invalid.", async () => {
  const user = userEvent.setup();
  const mockCallback = jest.fn();
  render(
    <InlineTextControl pattern="\w+" defaultValue="Foo" onSave={mockCallback} />
  );
  const textInput = screen.getByRole("textbox");
  await user.type(textInput, "Foo$%");
  await user.keyboard("[Enter]");
  expect(mockCallback).not.toHaveBeenCalled();
});

it("Does not call save callback when numpad enter key is pressed and text is invalid.", async () => {
  const user = userEvent.setup();
  const mockCallback = jest.fn();
  render(
    <InlineTextControl pattern="\w+" defaultValue="Foo" onSave={mockCallback} />
  );
  const textInput = screen.getByRole("textbox");
  await user.type(textInput, "Foo$%");
  await user.keyboard("[NumpadEnter]");
  expect(mockCallback).not.toHaveBeenCalled();
});

it("Does not call save callback when save button is pressed with invalid default value.", async () => {
  const user = userEvent.setup();
  const mockCallback = jest.fn();
  render(
    <InlineTextControl
      defaultValue="Foo$%"
      pattern="\w+"
      onSave={mockCallback}
    />
  );
  const saveButton = screen.getByRole("button", { name: /^Save$/ });
  await user.click(saveButton);
  expect(mockCallback).not.toHaveBeenCalled();
});
