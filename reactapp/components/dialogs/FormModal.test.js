import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";

import FormModal from "./FormModal";

it("Creates a modal dialog", () => {
  render(<FormModal show >{() => {}}</FormModal>);
  const modal = screen.getByRole("dialog");
  expect(modal).toBeInTheDocument();
});

it("Creates a modal dialog with heading displaying title given", () => {
  render(<FormModal show title="Foo" >{() => {}}</FormModal>);
  const modal = screen.getByRole("dialog");
  const title = screen.getByRole("heading", { name: /Foo/ });
  expect(modal).toContainElement(title);
});

it("Creates a close button in the modal dialog", () => {
  render(<FormModal show>{() => {}}</FormModal>);
  const modal = screen.getByRole("dialog");
  const closeButton = screen.getByRole("button", { name: /Close/ });
  expect(modal).toContainElement(closeButton);
});

it("Creates a cancel button in the modal dialog", () => {
  render(<FormModal show>{() => {}}</FormModal>);
  const modal = screen.getByRole("dialog");
  const cancelButton = screen.getByRole("button", { name: /Cancel/ });
  expect(modal).toContainElement(cancelButton);
});

it("Creates a submit button in the modal dialog", () => {
  render(<FormModal show>{() => {}}</FormModal>);
  const modal = screen.getByRole("dialog");
  const submitButton = screen.getByRole("button", { name: /Submit/ });
  expect(modal).toContainElement(submitButton);
});

it("Creates a fieldset in the modal dialog", () => {
  render(<FormModal show>{() => {}}</FormModal>);
  const modal = screen.getByRole("dialog");
  const fieldset = screen.getByRole("group");
  expect(modal).toContainElement(fieldset);
});

it("Renders child elements inside the fieldset of the modal dialog", () => {
  render(
    <FormModal show>
      {() => (
        <>
          <label htmlFor="username-input">Username</label>
          <input id="username-input" name="username"></input>
        </>
      )}
    </FormModal>
  );
  const fieldset = screen.getByRole("group");
  const input = screen.getByRole("textbox", { name: /Username/i });
  expect(fieldset).toContainElement(input);
});

it("Calls the close callback when close button is pressed", async () => {
  const user = userEvent.setup();
  const mockCallback = jest.fn();
  render(
    <FormModal show onClose={mockCallback}>
      {() => {}}
    </FormModal>
  );
  const closeButton = screen.getByRole("button", { name: /Close/ });
  await user.click(closeButton);
  expect(mockCallback).toHaveBeenCalled();
});

it("Calls the close callback when cancel button is pressed", async () => {
  const user = userEvent.setup();
  const mockCallback = jest.fn();
  render(<FormModal show onClose={mockCallback} >{() => {}}</FormModal>);
  const cancelButton = screen.getByRole("button", { name: /Cancel/ });
  await user.click(cancelButton);
  expect(mockCallback).toHaveBeenCalled();
});

it("Calls the submit callback when form is valid and submit button is pressed", async () => {
  const user = userEvent.setup();
  const mockCallback = jest.fn();
  render(
    <FormModal show onSubmit={mockCallback}>
      {() =>(
        <>
          <label htmlFor="username-input">Username</label>
          <input id="username-input" name="username" pattern="\w+" />
        </>
      )}
    </FormModal>
  );
  const submit = screen.getByRole("button", { name: /Submit/ });
  const input = screen.getByRole("textbox", { name: /Username/i });
  await user.type(input, "foo");
  await user.click(submit);
  expect(mockCallback).toHaveBeenCalled();
  const event = mockCallback.mock.calls[0][0];
  expect(event.type).toBe("submit");
  // eslint-disable-next-line testing-library/no-node-access
  expect(event.target.children[0].children[1].value).toBe("foo");
});

it("Does not call the submit callback when form is invalid and submit button is pressed", async () => {
  const user = userEvent.setup();
  const mockCallback = jest.fn();
  render(
    <FormModal show onSubmit={mockCallback}>
      {() => (
        <>
          <label htmlFor="username-input">Username</label>
          <input id="username-input" name="username" pattern="\w+" />
        </>
      )}
    </FormModal>
  );
  const submit = screen.getByRole("button", { name: /Submit/ });
  const input = screen.getByRole("textbox", { name: /Username/i });
  await user.type(input, "foo$%");
  await user.click(submit);
  expect(mockCallback).not.toHaveBeenCalled();
});

it("Calls the reset callback when hidden/closed", async () => {
  const mockCallback = jest.fn();
  const {rerender} = render(
    <FormModal show={true} onReset={mockCallback}>
      {() => {}}
    </FormModal>
  );
  const cancelButton = screen.getByRole("button", { name: /Cancel/ });
  rerender(
    <FormModal show={false} onReset={mockCallback}>
      {() => {}}
    </FormModal>
  );

  await waitFor(() => {
    expect(cancelButton).not.toBeInTheDocument();
  })
  expect(mockCallback).toHaveBeenCalled();
});
