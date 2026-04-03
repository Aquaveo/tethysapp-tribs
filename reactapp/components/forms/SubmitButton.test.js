import { render, screen } from "@testing-library/react";
import { Formik } from "formik";

import SubmitButton from "./SubmitButton";

it("Renders a submit button", () => {
  render(
    <Formik>
      <SubmitButton title="Foo" />
    </Formik>
  );

  const button = screen.getByRole("button", { name: /Foo/ });
  expect(button).toBeInTheDocument();
  expect(button.type).toBe("submit");
});
