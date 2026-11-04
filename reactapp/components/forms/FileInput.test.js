import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { renderWithForm } from "config/tests/renderWithForm";

import FileInput from "./FileInput";

it("Renders a file input with given label and name", () => {
  renderWithForm(<FileInput name="foo" label="Foo" />);

  const input = screen.getByLabelText(/Foo/);
  expect(input).toBeInTheDocument();
  expect(input.type).toBe("file");
});

it("Gets initial value from form context", () => {
  const file = new File(["bits"], "bar.txt", { type: "text/plain" });
  const initialValues = {
    foo: file,
  };

  renderWithForm(<FileInput name="foo" label="Foo" />, { initialValues });

  const input = screen.getByLabelText(/Foo/);
  expect(input.value).toBe("bar.txt");
});

it("Displays remove button and read-only input when file uploaded instead of file input", async () => {
  const user = userEvent.setup();
  const file = new File(["bits"], "bar.txt", { type: "text/plain" });
  const initialValues = {
    foo: null,
  };

  renderWithForm(<FileInput name="foo" label="Foo" />, { initialValues });

  const input = screen.getByLabelText(/Foo/);
  await user.upload(input, file);

  const textInput = await screen.findByRole("textbox");
  const removeButton = await screen.findByRole("button", {
    name: /Remove File/,
  });
  expect(removeButton).toBeVisible();
  expect(textInput).toBeVisible();
  expect(textInput.value).toBe(file.name);
  expect(input).not.toBeInTheDocument();
});

it("Pressing the remove button restores the file input and clears value", async () => {
  const user = userEvent.setup();
  const file = new File(["bits"], "bar.txt", { type: "text/plain" });
  const initialValues = {
    foo: file,
  };

  renderWithForm(<FileInput name="foo" label="Foo" />, { initialValues });

  const textInput = await screen.findByRole("textbox");
  const removeButton = await screen.findByRole("button", {
    name: /Remove File/,
  });
  await user.click(removeButton);

  const input = await screen.findByLabelText(/Foo/);
  expect(removeButton).not.toBeInTheDocument();
  expect(textInput).not.toBeInTheDocument();
  expect(input).toBeInTheDocument();
  expect(input.files).toHaveLength(0);
});

// it("Displays error message when invalid", async () => {
//   const user = userEvent.setup();
//   const file = new File(["bits"], "bar.txt", { type: "text/plain" });
//   const initialValues = {
//     foo: null,
//   };
//   const schema = Yup.object().shape({
//     foo: Yup.object().required(),
//   });

//   renderWithForm(<FileInput name="foo" label="Foo" accept=".csv" />, {
//     initialValues,
//     validationSchema: schema,
//   });

//   const input = screen.getByLabelText(/Foo/);
//   await user.upload(input, file); // .txt rejected
//   await user.tab(); // move focus

//   const error = await screen.findByText(/foo is a required field/i);
//   expect(error).toBeVisible();
// });

it("Raises an error if id or name props not given", () => {
  const mockError = jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  expect(() => {
    renderWithForm(<FileInput label="Foo" />);
  }).toThrow();
  expect(mockError.mock.calls[0][2]).toBe(
    'One of the props "id" or "name" was not specified in "FileInput"'
  );
  jest.restoreAllMocks();
});
