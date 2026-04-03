import userEvent from "@testing-library/user-event";
import * as Yup from "yup";
import { render, screen } from "@testing-library/react";
import { Formik } from "formik";

import NumberInput from "./NumberInput";

it("Renders a number input (spinbutton) with given label and name", () => {
  render(
    <Formik>
      <NumberInput name="foo" label="Foo" />
    </Formik>
  );

  const input = screen.getByRole("spinbutton", { name: /Foo/ });
  expect(input).toBeInTheDocument();
  expect(input.name).toBe("foo");
  expect(input.type).toBe("number");
});

it("Renders units next to the input if given", () => {
  render(
    <Formik>
      <NumberInput name="foo" label="Foo" units="bar" />
    </Formik>
  );

  const units = screen.getByText(/bar/);
  expect(units).toBeInTheDocument();
});

it("Gets initial value from Formik context", () => {
  const initialValues = {
    foo: 10,
  };

  render(
    <Formik initialValues={initialValues}>
      <NumberInput name="foo" label="Foo" />
    </Formik>
  );

  const input = screen.getByRole("spinbutton", { name: /Foo/ });
  expect(input.value).toBe("10");
});

it("Displays error message when invalid", async () => {
  const user = userEvent.setup();
  const initialValues = {
    foo: 10,
  };
  const schema = Yup.object().shape({
    foo: Yup.number().min(5),
  });

  render(
    <Formik initialValues={initialValues} validationSchema={schema}>
      <NumberInput name="foo" label="Foo" />
    </Formik>
  );

  const input = screen.getByRole("spinbutton", { name: /Foo/ });
  await user.clear(input);
  await user.type(input, "1");
  await user.tab(); // move focus

  const error = await screen.findByText(
    /foo must be greater than or equal to 5/i
  );
  expect(error).toBeInTheDocument();
});

it("Will not change when readOnly", async () => {
  const user = userEvent.setup();
  const initialValues = {
    foo: 10,
  };
  const schema = Yup.object().shape({
    foo: Yup.number(),
  });

  render(
    <Formik initialValues={initialValues} validationSchema={schema}>
      <NumberInput name="foo" label="Foo" readOnly />
    </Formik>
  );

  const input = screen.getByRole("spinbutton", { name: /Foo/ });
  await user.type(input, "5");

  expect(input).toHaveValue(10);
});

it("Raises an error if id or name props not given", () => {
  const mockError = jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  expect(() => {
    render(
      <Formik>
        <NumberInput label="Foo" />
      </Formik>
    );
  }).toThrow();
  expect(mockError.mock.calls[0][2]).toBe(
    'One of the props "id" or "name" was not specified in "NumberInput"'
  );
  jest.restoreAllMocks();
});
