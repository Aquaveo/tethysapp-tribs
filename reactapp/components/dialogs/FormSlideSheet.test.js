import userEvent from "@testing-library/user-event";
import * as Yup from "yup";
import { render, screen } from "@testing-library/react";
import { Field } from "formik";

import FormSlideSheet from "./FormSlideSheet";

const initAndRender = (useChildCallback = false) => {
  const user = userEvent.setup();
  const closeCallback = jest.fn();
  const submitCallback = jest.fn();
  const childCallback = jest.fn();
  const initialValues = { email: "foo@example.com" };
  const validationSchema = Yup.object().shape({
    email: Yup.string().required(),
  });
  render(
    <FormSlideSheet
      title="Foo"
      initialValues={initialValues}
      validationSchema={validationSchema}
      onClose={closeCallback}
      onSubmit={submitCallback}
      show
    >
      {useChildCallback
        ? childCallback
        : () => (
            <>
              <label htmlFor="email">Email</label>
              <Field type="email" id="email" name="email" placeholder="Email" />
            </>
          )}
    </FormSlideSheet>
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
it("Creates a dialog", () => {
  initAndRender();
  const dialog = screen.getByRole("dialog");
  expect(dialog).toBeInTheDocument();
  expect(dialog).toBeVisible();
});

it("Creates a dialog with given title", () => {
  initAndRender();
  const dialog = screen.getByRole("dialog");
  const title = screen.getByText("Foo");
  expect(dialog).toContainElement(title);
});

it("Creates a dialog with a close button", () => {
  initAndRender();
  const dialog = screen.getByRole("dialog");
  const closeButton = screen.getByRole("button", { name: /Close/ });
  expect(dialog).toContainElement(closeButton);
});

it("Has a render prop on the children element that is passed the formik object", () => {
  const { childCallback } = initAndRender(true);
  expect(childCallback).toHaveBeenCalledWith(
    expect.objectContaining({
      dirty: false,
      errors: {},
      values: { email: "foo@example.com" },
      touched: {},
      initialValues: { email: "foo@example.com" },
    })
  );
});

it("Can have formik Fields as children and they will be fully controlled.", () => {
  initAndRender();
  const dialog = screen.getByRole("dialog");
  const input = screen.getByRole("textbox", { name: /Email/ });
  expect(dialog).toContainElement(input);
  expect(input.value).toEqual("foo@example.com");
});

it("Shows a save button when the form is dirty", async () => {
  const { user } = initAndRender();
  const dialog = screen.getByRole("dialog");
  const input = screen.getByRole("textbox", { name: /Email/ });
  await user.clear(input);
  await user.type(input, "bar@example.com");
  const saveButton = await screen.findByRole("button", { name: /^Save$/ });
  expect(dialog).toContainElement(saveButton);
});

it("Calls submit callback with form values when save button is pressed", async () => {
  const { user, submitCallback } = initAndRender();
  const input = screen.getByRole("textbox", { name: /Email/ });
  await user.clear(input);
  await user.type(input, "bar@example.com");
  const saveButton = await screen.findByRole("button", { name: /^Save$/ });
  await user.click(saveButton);
  expect(submitCallback).toHaveBeenCalledWith(
    {
      email: "bar@example.com",
    },
    expect.objectContaining({})
  );
});

it("Does not call submit callback when fields are invalid", async () => {
  const { user, submitCallback } = initAndRender();
  const input = screen.getByRole("textbox", { name: /Email/ });
  await user.clear(input); // required
  const saveButton = await screen.findByRole("button", { name: /^Save$/ });
  await user.click(saveButton);
  expect(submitCallback).not.toHaveBeenCalled();
});

it("Calls the close callback when close button is pressed", async () => {
  const { user, closeCallback } = initAndRender();
  const closeButton = screen.getByRole("button", { name: /Close/ });
  await user.click(closeButton);
  expect(closeCallback).toHaveBeenCalled();
});
