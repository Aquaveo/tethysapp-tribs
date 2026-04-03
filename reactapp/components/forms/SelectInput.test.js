import { render, screen, act } from "@testing-library/react";
import { Formik } from "formik";

import SelectInput from "./SelectInput";
import { select } from "react-select-event";
import { object, string } from "yup";

const mockedOptions = [
  {value: '', label: 'Select an Option'},
  {value: '1', label: 'One'},
  {value: '2', label: 'Two'},
];

// This is to get rid of all the bogus errors.
// Even though all of the changes to the dropdown are wrapped in act
// These errors are unavoidable because of the React Select dropdown.
// This will still allow other errors to shine through.
const BOGUS_ERROR =
  "Warning: An update to Formik inside a test was not wrapped in act";
const originalWarn = console.error.bind(console.error);
beforeAll(() => {
  console.error = (msg) =>
    msg.toString().includes(BOGUS_ERROR) && originalWarn(msg);
});
afterAll(() => {
  console.error = originalWarn;
});

it("Renders a select input with given label and name and options", () => {
  render(
    <Formik>
      <SelectInput
        name="foo"
        label="Foo"
        options={mockedOptions}
      />
    </Formik>
  );

  const input = screen.queryByTestId("Foo");
  expect(input).toBeVisible();
});

it("Gets initial value from Formik context", () => {
  const initialValues = {
    foo: "1",
  };

  render(
    <Formik initialValues={initialValues}>
      <SelectInput
        name="foo"
        label="Foo"
        options={mockedOptions}
      />
    </Formik>
  );

  expect(screen.queryByText('Select an option')).not.toBeInTheDocument()
  expect(screen.getByText('One')).toBeInTheDocument();
});

it("calls onChange prop with selected option value", async () => {
  const initialValues = {
    foo: "1",
  };
  render(
    <Formik
      initialValues={initialValues}
      validationSchema={object()}
      onSubmit={() => {}}
    >
      <SelectInput name="foo" label="Foo" options={mockedOptions} />
    </Formik>
  );

  const dropdownElement = screen.getByLabelText("Foo");
  const selectOption = "Select an Option";
  expect(screen.queryByText(selectOption)).not.toBeInTheDocument();
  await act(() => {
    select(dropdownElement, selectOption);
  });

  expect(screen.getByText(selectOption)).toBeInTheDocument();
  expect(dropdownElement).toHaveValue("");
});

it("Does not change when readOnly", async () => {
  const initialValues = {
    foo: "1",
  };
  render(
    <Formik
      initialValues={initialValues}
      validationSchema={object()}
      onSubmit={() => {}}
    >
      <SelectInput name="foo" label="Foo" options={mockedOptions} readOnly />
    </Formik>
  );

  const dropdownElement = screen.getByLabelText("Foo");
  const selectOption = "Select an Option";
  expect(screen.queryByText(selectOption)).not.toBeInTheDocument();
  await act(() => {
    select(dropdownElement, selectOption);
  });

  expect(screen.queryByText(selectOption)).not.toBeInTheDocument();
  expect(dropdownElement).toHaveValue("");
});

it("Displays error message when invalid", async () => {
  const initialValues = {
    foo: "1",
  };
  const schema = object().shape({
    foo: string().required(),
  });

  render(
    <Formik initialValues={initialValues} validationSchema={schema}>
      <SelectInput name="foo" label="Foo" options={mockedOptions} />
    </Formik>
  );
  const dropdownElement = screen.getByRole("combobox");
  const selectOption = "Select an Option";
  expect(screen.queryByText(selectOption)).not.toBeInTheDocument();
  await act(() => {
    select(dropdownElement, selectOption);
  });

  const error = await screen.findByText(/foo is a required field/i);
  expect(error).toBeVisible();
});

it("Raises an error if id or name props not given", () => {
  const mockError = jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  expect(() => {
    render(
      <Formik>
        <SelectInput
          label="Foo"
          options={mockedOptions}
        />
      </Formik>
    );
  }).toThrow();
  expect(mockError.mock.calls[0][2]).toBe(
    'One of the props "id" or "name" was not specified in "SelectInput"'
  );
  jest.restoreAllMocks();
});
