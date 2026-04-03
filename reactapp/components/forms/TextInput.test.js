import userEvent from "@testing-library/user-event";
import * as Yup from "yup";
import { render, screen } from "@testing-library/react";
import { Formik } from "formik";

import TextInput from "./TextInput";

it("Renders a text input with given label and name", () => {
  render(
    <Formik>
      <TextInput name="foo" label="Foo" />
    </Formik>
  );

  const input = screen.getByRole("textbox", { name: /Foo/ });
  expect(input).toBeInTheDocument();
  expect(input.type).toBe("text");
});

it("Gets initial value from Formik context", () => {
  const initialValues = {
    foo: "Bar",
  };

  render(
    <Formik initialValues={initialValues}>
      <TextInput name="foo" label="Foo" />
    </Formik>
  );

  const input = screen.getByRole("textbox", { name: /Foo/ });
  expect(input.value).toBe("Bar");
});

it("Displays error message when invalid", async () => {
  const user = userEvent.setup();
  const initialValues = {
    foo: "Bar",
  };
  const schema = Yup.object().shape({
    foo: Yup.string().required(),
  });

  render(
    <Formik initialValues={initialValues} validationSchema={schema}>
      <TextInput name="foo" label="Foo" />
    </Formik>
  );

  const input = screen.getByRole("textbox", { name: /Foo/ });
  await user.clear(input);
  await user.tab(); // move focus

  const error = await screen.findByText(/foo is a required field/i);
  expect(error).toBeVisible();
});

it("Will not change when readOnly", async () => {
  const user = userEvent.setup();
  const initialValues = {
    foo: "Bar",
  };
  const schema = Yup.object().shape({
    foo: Yup.string().required(),
  });

  render(
    <Formik initialValues={initialValues} validationSchema={schema}>
      <TextInput name="foo" label="Foo" readOnly />
    </Formik>
  );

  const input = screen.getByRole("textbox", { name: /Foo/ });
  await user.type(input, "5");

  expect(input).toHaveValue("Bar");
});

it("Raises an error if id or name props not given", () => {
  const mockError = jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  expect(() => {
    render(
      <Formik>
        <TextInput label="Foo" />
      </Formik>
    );
  }).toThrow();
  expect(mockError.mock.calls[0][2]).toBe(
    'One of the props "id" or "name" was not specified in "TextInput"'
  );
  jest.restoreAllMocks();
});
