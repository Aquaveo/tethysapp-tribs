import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";

const initAndRender = async () => {
  const user = userEvent.setup();
  const deleteCallback = jest.fn();
  const deleteCancelCallback = jest.fn();
  const ModalRender = (show = false) => {
    return (
      <ConfirmDeleteModal
        showConfirm={show}
        handleDeleteCancel={deleteCancelCallback}
        handleDeleteConfirm={deleteCallback}
      />
    );
  };
  const { rerender } = render(ModalRender(true));

  return {
    user,
    rerender,
    ModalRender,
    deleteCallback,
    deleteCancelCallback
  };
}

it("Renders a Modal Window with a message, title, and buttons", async () => {
  await initAndRender();
  const title = screen.getByText("Confirm Delete");
  const message = screen.getByText("Default Message");
  const confirmDeleteButton = screen.getByRole("button", { name: "Yes" })
  const cancelDeleteButton = screen.getByRole("button", { name: "No" })
  expect(title).toBeInTheDocument();
  expect(message).toBeInTheDocument();
  expect(confirmDeleteButton).toBeInTheDocument();
  expect(cancelDeleteButton).toBeInTheDocument();
});

it("Renders a modal with a custom message and title", async () => {
  const customMessage = "Are you about this??"
  const customTitle = "Random Title"
  const deleteCallback = jest.fn();
  const deleteCancelCallback = jest.fn();
  await render(
    <ConfirmDeleteModal
      showConfirm={true}
      handleDeleteCancel={deleteCancelCallback}
      handleDeleteConfirm={deleteCallback}
      title={customTitle}
      message={customMessage}
    />
  );

  expect(screen.getByText(customMessage)).toBeInTheDocument();
  expect(screen.getByText(customTitle)).toBeInTheDocument();
});

it("Calls the confirmDeleteCallback and closes Modal", async () => {
  const { user, deleteCallback, rerender, ModalRender } = await initAndRender();
  const confirmDeleteButton = screen.getByRole("button", { name: "Yes" })
  await user.click(confirmDeleteButton);

  expect(deleteCallback).toHaveBeenCalled();
  await rerender(ModalRender(false));
  const pauseFor = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds));
  await pauseFor(500);

  const newDeleteButton = screen.queryByRole("button", { name: "No" })

  expect(newDeleteButton).not.toBeInTheDocument();
});

it("Calls the deleteCancelCallback and closes Modal", async () => {
  const { user, deleteCancelCallback, rerender, ModalRender } = await initAndRender();
  const cancelDeleteButton = screen.getByRole("button", { name: "No" })
  await user.click(cancelDeleteButton);

  expect(deleteCancelCallback).toHaveBeenCalled();
  await rerender(ModalRender(false));
  const pauseFor = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds));
  await pauseFor(500);

  const newDeleteButton = screen.queryByRole("button", { name: "No" })

  expect(newDeleteButton).not.toBeInTheDocument();
});
