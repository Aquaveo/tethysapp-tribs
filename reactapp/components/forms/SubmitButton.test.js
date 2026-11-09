import { render, screen } from "@testing-library/react";
import SubmitButton from "./SubmitButton";

it("Renders a submit button", () => {
  render(<SubmitButton title="Foo" />);

  const button = screen.getByRole("button", { name: /Foo/ });
  expect(button).toBeInTheDocument();
  expect(button.type).toBe("submit");
});
