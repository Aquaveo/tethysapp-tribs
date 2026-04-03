import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { BsEmojiSmileFill, BsEmojiSmileUpsideDownFill } from "react-icons/bs";

import ToggleAction from "./ToggleAction";

it("Creates a button", async () => {
  render(
    <ToggleAction
      onTitle="Happy"
      onIcon={<BsEmojiSmileFill />}
      offTitle="Upside Down"
      offIcon={<BsEmojiSmileUpsideDownFill />}
    />
  );
  const actionButton = await screen.findByRole("button");
  expect(actionButton).toBeInTheDocument();
});

it("Creates a button with onTitle by default", () => {
  render(
    <ToggleAction
      onTitle="Happy"
      onIcon={<BsEmojiSmileFill />}
      offTitle="Upside Down"
      offIcon={<BsEmojiSmileUpsideDownFill />}
    />
  );
  const actionButton = screen.getByRole("button", { name: /Happy/ });
  expect(actionButton).toBeInTheDocument();
});

it("Creates a button without visible text when inline", () => {
  render(
    <ToggleAction
      inline
      onTitle="Happy"
      onIcon={<BsEmojiSmileFill />}
      offTitle="Upside Down"
      offIcon={<BsEmojiSmileUpsideDownFill />}
    />
  );
  const actionButton = screen.queryByText("Happy");
  expect(actionButton).toBeNull();
});

it("Creates a button with offTitle by default when off is set", () => {
  render(
    <ToggleAction
      onTitle="Happy"
      onIcon={<BsEmojiSmileFill />}
      offTitle="Upside Down"
      offIcon={<BsEmojiSmileUpsideDownFill />}
      off
    />
  );
  const actionButton = screen.getByRole("button", { name: /Upside Down/ });
  expect(actionButton).toBeInTheDocument();
});

it("Toggles titles when clicked", async () => {
  const user = userEvent.setup();
  render(
    <ToggleAction
      onTitle="Happy"
      onIcon={<BsEmojiSmileFill />}
      offTitle="Upside Down"
      offIcon={<BsEmojiSmileUpsideDownFill />}
    />
  );
  await user.click(screen.getByRole("button", { title: /Happy/ }));
  const toggledButton = await screen.findByRole("button", {
    name: /Upside Down/,
  });
  expect(toggledButton).toBeInTheDocument();
});

it("Toggles titles when clicked and calls bound callback", async () => {
  const user = userEvent.setup();
  const mockCallback = jest.fn();
  render(
    <ToggleAction
      onTitle="Happy"
      onIcon={<BsEmojiSmileFill />}
      offTitle="Upside Down"
      offIcon={<BsEmojiSmileUpsideDownFill />}
      onClick={mockCallback}
    />
  );
  await user.click(screen.getByRole("button", { title: /Happy/ }));
  const toggledButton = await screen.findByRole("button", {
    name: /Upside Down/,
  });
  expect(mockCallback).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "click",
      target: toggledButton,
    }),
    false
  );
});
