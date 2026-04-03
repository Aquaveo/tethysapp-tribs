import { render, screen, waitFor } from "@testing-library/react";
import * as Yup from 'yup';
import FormikSheet from "./FormikSheet";
import userEvent from "@testing-library/user-event";
import { Field } from "formik";

const initAndRender = (useChildCallback = false, show = true) => {
  const user = userEvent.setup();
  const closeCallback = jest.fn();
  const submitCallback = jest.fn();
  const childCallback = jest.fn();
  const initialValues = { email: "foo@example.com" };
  const validationSchema = Yup.object().shape({
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
  });
  render(
    <FormikSheet
      title="Foo"
      initialValues={initialValues}
      validationSchema={validationSchema}
      onClose={closeCallback}
      onSubmit={submitCallback}
      show={show}
    >
      {useChildCallback
        ? childCallback
        : () => (
          <>
            <label htmlFor="email">Email</label>
            <Field type="email" id="email" name="email" placeholder="Email" />
          </>
      )}
    </FormikSheet>
  );
  return {
    user,
    initialValues,
    validationSchema,
    childCallback,
    closeCallback,
    submitCallback,
  };
};

it("Creates a modal dialog", () => {
  initAndRender();
  const modal = screen.getByRole("dialog");
  expect(modal).toBeInTheDocument();
});

it("Doesn't show a modal dialog", () => {
  initAndRender(false, false);
  const modal = screen.queryByRole("dialog");
  expect(modal).not.toBeInTheDocument();
});

it("Creates a modal dialog with heading displaying title given", () => {
  initAndRender();
  const modal = screen.getByRole("dialog");
  const title = screen.getByRole("heading", { name: /Foo/ });
  expect(modal).toContainElement(title);
});

it("Creates a close button in the modal dialog", () => {
  initAndRender();
  const modal = screen.getByRole("dialog");
  const closeButton = screen.getByRole("button", { name: /Close/ });
  expect(modal).toContainElement(closeButton);
});

it("Creates a cancel button in the modal dialog", () => {
  initAndRender();
  const modal = screen.getByRole("dialog");
  const cancelButton = screen.getByRole("button", { name: /Close/ });
  expect(modal).toContainElement(cancelButton);
});

it("Closes modal on 'Save & Close' button click", async () => {
  const { user, closeCallback } = initAndRender();

  const inputField = screen.getByRole("textbox", { name: /Email/ });
  await user.clear(inputField);
  await user.type(inputField, "bar@example.com")

  const saveButton = screen.getByText("Save & Close");
  user.click(saveButton);

  await waitFor(() => {
    expect(closeCallback).toHaveBeenCalled();
  });
});

it("Calls onSubmit when Submit button is clicked", async () => {
  const { user, submitCallback } = initAndRender();

  const inputField = screen.getByRole("textbox", { name: /Email/ });
  await user.clear(inputField);
  await user.type(inputField, "bar@example.com")

  const saveButton = screen.getByText("Save");
  user.click(saveButton);

  await waitFor(() => {
    expect(submitCallback).toHaveBeenCalled();
  });
});
