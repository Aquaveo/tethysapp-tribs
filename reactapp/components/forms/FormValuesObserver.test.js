import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { Formik, Form } from "formik";

import FormValuesObserver from "./FormValuesObserver";

it("Calls callback with values when inputs in form change", async () => {
  const user = userEvent.setup();
  const mockCallback = jest.fn();
  render(
    <Formik initialValues={{ foo: "foo" }}>
      {(formik) => (
        <Form>
          <FormValuesObserver onChange={mockCallback} />
          <input
            type="text"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.name}
            name="foo"
          />
        </Form>
      )}
    </Formik>
  );

  const input = screen.getByRole("textbox");
  await user.type(input, "bar");
  expect(mockCallback).toHaveBeenCalledWith({ foo: "b" });
  expect(mockCallback).toHaveBeenCalledWith({ foo: "ba" });
  expect(mockCallback).toHaveBeenCalledWith({ foo: "bar" });
});
