import { render, screen } from "@testing-library/react";
import { BsEmojiSmileFill } from "react-icons/bs";

import Action from "./Action";

it("Creates a button when not inline", () => {
  render(<Action title="Foo" icon={<BsEmojiSmileFill />} />);
  const actionButton = screen.getByRole("button", { name: /Foo/ });
  expect(actionButton).toBeInTheDocument();
});

it("Creates a button with visible text when not inline", () => {
  render(<Action title="Foo" icon={<BsEmojiSmileFill />} />);
  const actionButton = screen.queryByText("Foo");
  expect(actionButton).toBeInTheDocument();
});

it("Creates a button when inline", () => {
  render(<Action inline title="Foo" icon={<BsEmojiSmileFill />} />);
  const actionButton = screen.getByRole("button", { name: /Foo/ });
  expect(actionButton).toBeInTheDocument();
});

it("Creates a button without visible text when inline", () => {
  render(<Action inline title="Foo" icon={<BsEmojiSmileFill />} />);
  const actionButton = screen.queryByText("Foo");
  expect(actionButton).toBeNull();
});
