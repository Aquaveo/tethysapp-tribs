import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { BsEmojiSmile } from "react-icons/bs";

import TreeItem from "./TreeItem";
import Action from "components/actions/Action";
import AddAction from "components/project/actions/AddAction";

it("Creates a tree item element with the given title", () => {
  render(<TreeItem title="Some Title" />);
  const treeItem = screen.getByText("Some Title");
  expect(treeItem).toBeInTheDocument();
});

it('Creates a tree item element titled "Tree Item" if no title given', () => {
  render(<TreeItem />);
  const treeItem = screen.getByText("Tree Item");
  expect(treeItem).toBeInTheDocument();
});

it("Can have an optional icon", () => {
  render(<TreeItem title="Some Title" icon={<BsEmojiSmile />} />);
  expect(screen.getByTestId("tree-item-icon")).toBeInTheDocument();
});

it('Contains an "Expand" button when not closed but no children', () => {
  render(<TreeItem title="Some Title"></TreeItem>);
  const expandButton = screen.getByRole("button", { name: /Expand/ });
  expect(expandButton).toBeInTheDocument();
});

it('Contains an "Expand" button when closed', () => {
  render(<TreeItem title="Some Title" />);
  const expandButton = screen.getByRole("button", { name: /Expand/ });
  const shrinkButton = screen.queryByRole("button", { name: /Shrink/ });
  expect(expandButton).toBeInTheDocument();
  expect(shrinkButton).not.toBeInTheDocument();
});

it("Opens a closed tree item when a new child is added", async () => {
  const user = userEvent.setup();
  const children = ["Subtitle1"];
  const addToChildren = jest.fn((name) => {
    children.push(name);
  });
  const { rerender } = render(
    <TreeItem
      title="Some Title"
      closed
      actions={[
        <AddAction
          title="Add Child"
          key={"child-add"}
          onClick={() => addToChildren(`Subtitle${children.length + 1}`)}
          inline
        />
      ]}
    >
      {children.map((title, i) => (
        <TreeItem key={`child-${i}`} title={title} leaf />
      ))}
    </TreeItem>
  );

  const expandButton = screen.getByRole("button", { name: /Expand/ });
  const fakeShrinkButton = screen.queryByRole("button", { name: /Shrink/ });
  expect(expandButton).toBeInTheDocument();
  expect(fakeShrinkButton).not.toBeInTheDocument();

  const addChildButton = screen.getByRole("button", { name: /Add Child/ });
  await user.click(addChildButton);
  expect(addToChildren).toHaveBeenCalled();
  expect(children).toHaveLength(2);

  rerender(
    <TreeItem
      title="Some Title"
      closed
      actions={[
        <AddAction
          title="Add Child"
          key={"child-add"}
          onClick={() => addToChildren(`Subtitle${children.length + 1}`)}
          inline
        />
      ]}
    >
      {children.map((title, i) => (
        <TreeItem key={`child-${i}`} title={title} leaf />
      ))}
    </TreeItem>
  );

  const fakeExpandButton = screen.queryByRole("button", { name: /Expand/ });
  expect(fakeExpandButton).not.toBeInTheDocument();
  const shrinkButton = screen.getByRole("button", { name: /Shrink/ });
  expect(shrinkButton).toBeInTheDocument();
});

it("Toggles the title of the toggle when clicked", async () => {
  const user = userEvent.setup();
  render(
    <TreeItem title="Some Title">
      <div>the child</div>
    </TreeItem>
  );
  const toggleButton = screen.getByRole("button", { name: /Expand/ });
  await user.click(toggleButton);
  expect(toggleButton.title).toBe("Shrink");
  await user.click(toggleButton);
  expect(toggleButton.title).toBe("Expand");
});

it("Is nestable with other Tree Items", () => {
  render(
    <TreeItem title="Parent">
      <TreeItem title="Nested" />
    </TreeItem>
  );
  const parentContent = screen.getByTestId("parent-tree-item-content");
  const nestedTreeitem = screen.getByTestId("nested-tree-item-container");
  // eslint-disable-next-line testing-library/no-node-access
  expect(parentContent.children).toContain(nestedTreeitem);
});

it("Should not contain an options menu button if no actions", () => {
  render(<TreeItem title="Some Title" />);
  const optionsButton = screen.queryByRole("button", { name: /Options/ });
  expect(optionsButton).toBeNull();
});

it("Can have inline action buttons", async () => {
  render(
    <TreeItem
      title="Some Title"
      actions={[
        <Action
          inline
          title="Smile"
          icon={<BsEmojiSmile />}
          onClick={jest.fn()}
          key="smile-action"
        />,
      ]}
    />
  );
  const actionButton = await screen.findByRole("button", { name: /Smile/ });
  expect(actionButton).toBeInTheDocument();
});

it("Should not have an options menu button when only inline actions provided", async () => {
  render(
    <TreeItem
      title="Some Title"
      actions={[
        <Action
          inline
          title="Smile"
          icon={<BsEmojiSmile />}
          onClick={jest.fn()}
          key="smile-action"
        />,
      ]}
    />
  );
  const optionsButton = screen.queryByRole("button", { name: /Options/ });
  expect(optionsButton).toBeNull();
});

it("Should contain an options menu button when non-inline actions included", async () => {
  render(
    <TreeItem
      title="Some Title"
      actions={[
        <Action
          title="Smile"
          icon={<BsEmojiSmile />}
          onClick={jest.fn()}
          key="smile-action"
        />,
      ]}
    />
  );
  const optionsButton = await screen.findByRole("button", { name: /Options/ });
  expect(optionsButton).toBeInTheDocument();
});

it("Cannot have child elements when leaf prop given", () => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  expect(() =>
    render(
      <TreeItem title="Parent" leaf>
        <TreeItem title="Nested" />
      </TreeItem>
    )
  ).toThrow(
    "Leaf Tree Items should not have child elements, but 1 child found!"
  );
  jest.restoreAllMocks();
});

it("Cannot have multiple child elements when leaf prop given", () => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  expect(() =>
    render(
      <TreeItem title="Parent" leaf>
        <TreeItem title="Nested" />
        <TreeItem title="Child" />
      </TreeItem>
    )
  ).toThrow(
    "Leaf Tree Items should not have child elements, but 2 children found!"
  );
  jest.restoreAllMocks();
});

it("Does not have a toggle button when leaf prop given", () => {
  render(<TreeItem title="Parent" leaf />);
  const shrinkButton = screen.queryByRole("button", { name: /Shrink/ });
  expect(shrinkButton).toBeNull();
  const expandButton = screen.queryByRole("button", { name: /Expand/ });
  expect(expandButton).toBeNull();
});

it("Has a delete action in options menu when enabled", async () => {
  const user = userEvent.setup();
  render(<TreeItem title="Some Title" deletable />);
  const optionsButton = await screen.findByRole("button", { name: /Options/ });
  await user.click(optionsButton);
  const deleteButton = await screen.findByRole("button", { name: /Delete/ });
  expect(deleteButton).toBeInTheDocument();
});

it("Has an inline delete action when specified", () => {
  render(<TreeItem title="Some Title" deletable deleteInline />);
  const treeItem = screen.getByTestId("some-title-tree-item-container");
  const deleteButton = screen.getByRole("button", { name: /Delete/ });
  expect(treeItem).toContainElement(deleteButton);
});

it("Calls delete callback when delete action button pressed", async () => {
  const user = userEvent.setup();
  const mockCallback = jest.fn();
  render(<TreeItem title="Some Title" deletable onDelete={mockCallback} />);
  const optionsButton = await screen.findByRole("button", { name: /Options/ });
  await user.click(optionsButton);
  const deleteButton = await screen.findByRole("button", { name: /Delete/ });
  await user.click(deleteButton);
  expect(mockCallback).toHaveBeenCalled();
});

it("Has a duplicate action in options menu when enabled", async () => {
  const user = userEvent.setup();
  render(<TreeItem title="Some Title" duplicatable />);
  const optionsButton = await screen.findByRole("button", { name: /Options/ });
  await user.click(optionsButton);
  const duplicateButton = await screen.findByRole("button", { name: /Duplicate/ });
  expect(duplicateButton).toBeInTheDocument();
});

it("Has an inline duplicate action when specified", () => {
  render(<TreeItem title="Some Title" duplicatable duplicateInline />);
  const treeItem = screen.getByTestId("some-title-tree-item-container");
  const duplicateButton = screen.getByRole("button", { name: /Duplicate/ });
  expect(treeItem).toContainElement(duplicateButton);
});

it("Calls duplicate callback when duplicate action button pressed", async () => {
  const user = userEvent.setup();
  const mockCallback = jest.fn();
  render(<TreeItem title="Some Title" duplicatable onDuplicate={mockCallback} />);
  const optionsButton = await screen.findByRole("button", { name: /Options/ });
  await user.click(optionsButton);
  const duplicateButton = await screen.findByRole("button", { name: /Duplicate/ });
  await user.click(duplicateButton);
  expect(mockCallback).toHaveBeenCalled();
});

it("Has a frame action in options menu when enabled", async () => {
  const user = userEvent.setup();
  render(<TreeItem title="Some Title" frameable />);
  const optionsButton = await screen.findByRole("button", { name: /Options/ });
  await user.click(optionsButton);
  const frameButton = await screen.findByRole("button", { name: /Frame/ });
  expect(frameButton).toBeInTheDocument();
});

it("Has an inline frame action when specified", () => {
  render(<TreeItem title="Some Title" frameable frameInline />);
  const treeItem = screen.getByTestId("some-title-tree-item-container");
  const frameButton = screen.getByRole("button", { name: /Frame/ });
  expect(treeItem).toContainElement(frameButton);
});

it("Calls frame callback when frame action button pressed", async () => {
  const user = userEvent.setup();
  const mockCallback = jest.fn();
  render(<TreeItem title="Some Title" frameable onFrame={mockCallback} />);
  const optionsButton = await screen.findByRole("button", { name: /Options/ });
  await user.click(optionsButton);
  const frameButton = await screen.findByRole("button", { name: /Frame/ });
  await user.click(frameButton);
  expect(mockCallback).toHaveBeenCalled();
});

it("Has a rename action in options menu when enabled", async () => {
  const user = userEvent.setup();
  render(<TreeItem title="Some Title" renameable />);
  const optionsButton = await screen.findByRole("button", { name: /Options/ });
  await user.click(optionsButton);
  const renameButton = await screen.findByRole("button", { name: /Rename/ });
  expect(renameButton).toBeInTheDocument();
});

it("Has an inline rename action when specified", () => {
  render(<TreeItem title="Some Title" renameable renameInline />);
  const treeItem = screen.getByTestId("some-title-tree-item-container");
  const renameButton = screen.getByRole("button", { name: /Rename/ });
  expect(treeItem).toContainElement(renameButton);
});

it("Replaces title text and actions with inline rename form when rename option clicked", async () => {
  const user = userEvent.setup();
  const mockCallback = jest.fn();
  render(<TreeItem title="Some Title" renameable onRename={mockCallback} />);
  const optionsButton = await screen.findByRole("button", { name: /Options/ });
  const treeItemTitle = await screen.findByText(/Some Title/);
  await user.click(optionsButton);
  const renameButton = await screen.findByRole("button", { name: /Rename/ });
  await user.click(renameButton);
  const renameInput = await screen.findByRole("textbox");
  const renameSave = await screen.findByRole("button", { name: /^Save$/ });
  const renameCancel = await screen.findByRole("button", { name: /Cancel/ });
  expect(renameInput).toBeInTheDocument();
  expect(renameSave).toBeInTheDocument();
  expect(renameCancel).toBeInTheDocument();
  expect(optionsButton).not.toBeInTheDocument();
  expect(treeItemTitle).not.toBeInTheDocument();
});

it("Initializes rename field with title of tree item", async () => {
  const user = userEvent.setup();
  const mockCallback = jest.fn();
  render(<TreeItem title="Some Title" renameable onRename={mockCallback} />);
  const optionsButton = await screen.findByRole("button", { name: /Options/ });
  await user.click(optionsButton);
  const renameButton = await screen.findByRole("button", { name: /Rename/ });
  await user.click(renameButton);
  const renameInput = await screen.findByRole("textbox");
  expect(renameInput.value).toBe("Some Title");
});

it("Restores actions and title when rename cancel button is pressed", async () => {
  const user = userEvent.setup();
  const mockCallback = jest.fn();
  render(<TreeItem title="Some Title" renameable onRename={mockCallback} />);
  const optionsButton = await screen.findByRole("button", { name: /Options/ });
  await user.click(optionsButton);
  const renameButton = await screen.findByRole("button", { name: /Rename/ });
  await user.click(renameButton);
  const renameCancel = await screen.findByRole("button", { name: /Cancel/ });
  await user.click(renameCancel);
  expect(
    await screen.findByRole("button", { name: /Options/ })
  ).toBeInTheDocument();
  expect(await screen.findByText(/Some Title/)).toBeInTheDocument();
  expect(mockCallback).not.toHaveBeenCalled();
});

it("Restores actions and title, and calls callback when rename save button is pressed", async () => {
  const user = userEvent.setup();
  const mockCallback = jest.fn();
  render(<TreeItem title="Some Title" renameable onRename={mockCallback} />);
  const optionsButton = await screen.findByRole("button", { name: /Options/ });
  await user.click(optionsButton);
  const renameButton = await screen.findByRole("button", { name: /Rename/ });
  await user.click(renameButton);
  const renameInput = await screen.findByRole("textbox");
  const renameSave = await screen.findByRole("button", { name: /^Save$/ });
  await user.clear(renameInput);
  await user.type(renameInput, "A Different Title");
  await user.click(renameSave);
  expect(
    await screen.findByRole("button", { name: /Options/ })
  ).toBeInTheDocument();
  expect(await screen.findByText(/Some Title/)).toBeInTheDocument();
  expect(mockCallback).toHaveBeenCalledWith("A Different Title");
});

it("Does not save when rename save button is pressed and rename input is empty", async () => {
  const user = userEvent.setup();
  const mockCallback = jest.fn();
  render(<TreeItem title="Some Title" renameable onRename={mockCallback} />);
  const optionsButton = await screen.findByRole("button", { name: /Options/ });
  await user.click(optionsButton);
  const renameButton = await screen.findByRole("button", { name: /Rename/ });
  await user.click(renameButton);
  const renameInput = await screen.findByRole("textbox");
  const renameSave = await screen.findByRole("button", { name: /^Save$/ });
  await user.clear(renameInput);
  await user.click(renameSave);
  expect(renameInput).toBeInTheDocument(); // still here
  expect(mockCallback).not.toHaveBeenCalled();
});

it("Does not save when rename save button is pressed and rename input has only whitespace", async () => {
  const user = userEvent.setup();
  const mockCallback = jest.fn();
  render(<TreeItem title="Some Title" renameable onRename={mockCallback} />);
  const optionsButton = await screen.findByRole("button", { name: /Options/ });
  await user.click(optionsButton);
  const renameButton = await screen.findByRole("button", { name: /Rename/ });
  await user.click(renameButton);
  const renameInput = await screen.findByRole("textbox");
  const renameSave = await screen.findByRole("button", { name: /^Save$/ });
  await user.clear(renameInput);
  await user.type(renameInput, "     ");
  await user.click(renameSave);
  expect(renameInput).toBeInTheDocument(); // still here
  expect(mockCallback).not.toHaveBeenCalled();
});

it("Adds a context menu separator between frame and delete/rename actions", async () => {
  const user = userEvent.setup();
  render(<TreeItem title="Some Title" renameable deleteable frameable />);
  const optionsButton = await screen.findByRole("button", { name: /Options/ });
  await user.click(optionsButton);
  const separator1 = await screen.findByTestId("divider-1");
  expect(separator1).toBeVisible();
});

it("Adds a context menu separator between frame and delete when rename is inline", async () => {
  const user = userEvent.setup();
  render(
    <TreeItem title="Some Title" renameable renameInline deleteable frameable />
  );
  const optionsButton = await screen.findByRole("button", { name: /Options/ });
  await user.click(optionsButton);
  const separator1 = await screen.findByTestId("divider-1");
  expect(separator1).toBeVisible();
});

it("Adds a context menu separator between frame and rename when delete is inline", async () => {
  const user = userEvent.setup();
  render(
    <TreeItem title="Some Title" renameable deleteable deleteInline frameable />
  );
  const optionsButton = await screen.findByRole("button", { name: /Options/ });
  await user.click(optionsButton);
  const separator1 = await screen.findByTestId("divider-1");
  expect(separator1).toBeVisible();
});

it("Does not add a context menu separator between frame and delete/rename when frame is inline", async () => {
  const user = userEvent.setup();
  render(
    <TreeItem title="Some Title" renameable deleteable frameable frameInline />
  );
  const optionsButton = await screen.findByRole("button", { name: /Options/ });
  await user.click(optionsButton);
  const separator1 = screen.queryByTestId("divider-1");
  expect(separator1).toBeNull();
});

it("Does not add a context menu separator between frame and delete/rename when rename and delete are both inline", async () => {
  const user = userEvent.setup();
  render(
    <TreeItem
      title="Some Title"
      renameable
      renameInline
      deleteable
      deleteInline
      frameable
    />
  );
  const optionsButton = await screen.findByRole("button", { name: /Options/ });
  await user.click(optionsButton);
  const separator1 = screen.queryByTestId("divider-1");
  expect(separator1).toBeNull();
});

it("Adds a context menu separator between built in actions and custom actions", async () => {
  const user = userEvent.setup();
  render(
    <TreeItem
      title="Some Title"
      renameable
      deleteable
      frameable
      actions={[
        <Action
          title="Smile"
          icon={<BsEmojiSmile />}
          onClick={jest.fn()}
          key="smile-action"
        />,
      ]}
    />
  );
  const optionsButton = await screen.findByRole("button", { name: /Options/ });
  await user.click(optionsButton);
  const separator1 = await screen.findByTestId("divider-1");
  expect(separator1).toBeVisible();
  const separator2 = await screen.findByTestId("divider-2");
  expect(separator2).toBeVisible();
});
