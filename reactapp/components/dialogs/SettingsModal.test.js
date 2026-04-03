import { render, screen, fireEvent } from "@testing-library/react";
import SettingsModal from "./SettingsModal";

it("Renders with default props and title", () => {
  render(<SettingsModal show />);
  const titleElement = screen.getByText("Settings");
  expect(titleElement).toBeInTheDocument();
});

it("Doesn't render the sheet", () => {
  render(<SettingsModal />);
  const titleElement = screen.queryByText("Settings");
  expect(titleElement).not.toBeInTheDocument();
});

it("Renders children components", () => {
  render(
    <SettingsModal show>
      <div data-testid="child">Child Component</div>
    </SettingsModal>
  );
  const childElement = screen.getByTestId("child");
  expect(childElement).toBeInTheDocument();
});

it("Calls onClose when clicking close button", () => {
  const onCloseMock = jest.fn();
  render(<SettingsModal show onClose={onCloseMock} />);
  const closeButton = screen.getByRole("button", { name: "Close" });
  fireEvent.click(closeButton);
  expect(onCloseMock).toHaveBeenCalled();
});
