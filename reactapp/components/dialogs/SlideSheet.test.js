import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";

import SlideSheet from "./SlideSheet";

it("Creates a dialog", () => {
  render(<SlideSheet show title="My Slide Sheet" />);
  const dialog = screen.getByRole("dialog");
  expect(dialog).toBeInTheDocument();
  expect(dialog).toBeVisible();
});

it("Creates a dialog with given title", () => {
  render(<SlideSheet show title="My Slide Sheet" />);
  const dialog = screen.getByRole("dialog");
  const title = screen.getByText("My Slide Sheet");
  expect(dialog).toContainElement(title);
});

it("Creates a dialog with a close button", () => {
  render(<SlideSheet show title="My Slide Sheet" />);
  const dialog = screen.getByRole("dialog");
  const closeButton = screen.getByRole("button", { name: /Close/ });
  expect(dialog).toContainElement(closeButton);
});

it("Creates a dialog with child elements inside it", () => {
  render(
    <SlideSheet show title="My Slide Sheet">
      <div>A Child</div>
    </SlideSheet>
  );
  const dialog = screen.getByRole("dialog");
  const child = screen.getByText("A Child");
  expect(dialog).toContainElement(child);
});

it("Creates a dialog that is hidden by default", () => {
  const { rerender } = render(<SlideSheet title="My Slide Sheet" />);
  expect(screen.queryByRole("dialog")).toBe(null);
  rerender(<SlideSheet show title="My Slide Sheet" />); // set show
  const dialog = screen.queryByRole("dialog");
  expect(dialog).toBeVisible();
});

it("Calls the close callback when close button is pressed", async () => {
  const user = userEvent.setup();
  const mockCallback = jest.fn();
  render(<SlideSheet show title="My Slide Sheet" onClose={mockCallback} />);
  const closeButton = screen.getByRole("button", { name: /Close/ });
  await user.click(closeButton);
  expect(mockCallback).toHaveBeenCalled();
});

it("sits above the page content and inside the right-hand gutter", () => {
  render(<SlideSheet show placement="end" title="My Slide Sheet" />);
  const dialog = screen.getByRole("dialog");
  expect(dialog).toHaveStyle({ zIndex: 1025, marginRight: "10px" });
  expect(dialog.style.height).toBe(""); // no height unless the caller gives one
});

it("applies a caller's height inline", () => {
  render(<SlideSheet show placement="bottom" title="My Slide Sheet" style={{ height: "200px" }} />);
  expect(screen.getByRole("dialog").style.height).toBe("200px");
});

it("places header actions between the title and the close button", () => {
  render(<SlideSheet show title="My Slide Sheet" actions={<button type="button">Gear</button>} />);
  const title = screen.getByText("My Slide Sheet");
  const gear = screen.getByRole("button", { name: "Gear" });
  const close = screen.getByRole("button", { name: /Close/ });
  expect(title.compareDocumentPosition(gear) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(gear.compareDocumentPosition(close) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});
