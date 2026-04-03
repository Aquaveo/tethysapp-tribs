// import userEvent from "@testing-library/user-event";
import { date, object } from "yup";
import { render, screen } from "@testing-library/react";
import { Formik } from "formik";
import DateInput from "./DateInput";
import userEvent from "@testing-library/user-event";

it("Renders a date input with given label and name", () => {
  render(
    <Formik>
      <DateInput name="date" label="Date" />
    </Formik>
  );

  const input = screen.getByRole("textbox");
  expect(input).toBeInTheDocument();
});

it("Gets initial value from Formik context", () => {
  const initialValues = {
    date: new Date("12/25/2023"),
  };

  render(
    <Formik initialValues={initialValues}>
      <DateInput name="date" label="Date" />
    </Formik>
  );

  const input = screen.getByRole("textbox");
  expect(input.value).toBe("12/25/2023");
});

// Not sure why this one isn't working right now :/
it("Displays error message when date is not selected", async () => {
  const user = userEvent.setup();
  const initialValues = {
    date: "", // No initial date provided
  };
  const schema = object().shape({
    date: date().nullable().required("Date is required"), // Add validation for the date field
  });

  render(
    <Formik initialValues={initialValues} validationSchema={schema}>
      <DateInput name="date" label="Date" />
    </Formik>
  );

  const input = screen.getByRole("textbox", { name: "Date" });

  // Trigger validation by inputting date and then clearing it.
  await user.type(input, "01/01/2001");
  await user.clear(input);

  const error = await screen.findByText(/Date is required/i);
  expect(error).toBeVisible();
});

it("Raises an error if id or name props are not given", () => {
  const mockError = jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});

  expect(() => {
    render(
      <Formik>
        <DateInput label="Date" />
      </Formik>
    );
  }).toThrow();

  expect(mockError.mock.calls[0][2]).toBe(
    'One of the props "id" or "name" was not specified in "DateInput"'
  );

  jest.restoreAllMocks();
});

it("Changes the selected date", async () => {
  const user = userEvent.setup();
  const initialValues = {
    date: "",
  };

  render(
    <Formik initialValues={initialValues}>
      <DateInput name="date" label="Date" />
    </Formik>
  );

  const datePickerInput = screen.getByLabelText("Date");

  await user.type(datePickerInput, "12/31/2023");

  expect(datePickerInput.value).toBe("12/31/2023");
});

it("Cannot change the selected date when readOnly", async () => {
  const user = userEvent.setup();
  const initialValues = {
    date: "",
  };

  render(
    <Formik initialValues={initialValues}>
      <DateInput name="date" label="Date" readOnly />
    </Formik>
  );

  const datePickerInput = screen.getByLabelText("Date");

  await user.type(datePickerInput, "12/31/2023");

  expect(datePickerInput.value).not.toBe("12/31/2023");
});
