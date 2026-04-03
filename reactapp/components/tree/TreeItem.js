import styled from "styled-components";
import Collapse from "react-bootstrap/Collapse";
import Dropdown from "react-bootstrap/Dropdown";
import PropTypes from "prop-types";
import React, { useContext, useEffect, useRef, useState } from "react";

import CollapseToggleButton from "components/buttons/CollapseToggleButton";
import ContextMenu from "components/context-menu/ContextMenu";
import DeleteAction from "components/project/actions/DeleteAction";
import FrameAction from "components/project/actions/FrameAction";
import InlineTextControl from "components/controls/InlineTextControl";
import RenameAction from "components/project/actions/RenameAction";
import DuplicateAction from "components/project/actions/DuplicateAction";
import useOnUpdate from "hooks/useOnUpdate";
import { matchesUUID } from "./propTypes";
import { ProjectContext } from "react-tethys/context";

const TreeItemContainer = styled.div`
  transition: background-color .5s ease;
  background-color: ${
    (props) => {
      const highlightColor = props.highlight ? "lemonchiffon !important" : null;
      const backgroundColor = props?.style?.backgroundColor ? props.style.backgroundColor : "unset"
      return (
        highlightColor ? highlightColor : backgroundColor
      )
    }
  };

  ${(props) =>
    props.button && !props.disabled &&
    `
      cursor: pointer;
      border-radius: 4px;
      &:hover {
        box-shadow: 0px 2px 8px 0 rgba(0,0,0,0.24), 0 17px 100px 0 rgba(0,0,0,0.19);
      }
      &:active {
        transform: translateY(2px);
      }
    `
  };

  ${(props) => 
    props.disabled &&
    `
      opacity: 0.6;
      cursor: not-allowed;
    `
  };
`;

const TreeItemHeader = styled.div`
  display: flex;
  flex-grow: 4;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  white-space: nowrap;
`;

const TreeItemHeaderLeft = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: start;
  width: ${(props) => props.width || '80%'};
`;

const TreeItemHeaderRight = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: end;
`;

const TreeItemTitle = styled.span`
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TreeItemContent = styled.div`
  padding-left: 1.5rem;
`;

const TreeItemPadding = styled.div`
  padding-left: 1rem;
`;

const TreeItemIcon = styled.div`
  padding-right: 0.375rem;
  border: 1px solid transparent;
  font-size: 14px;
  line-height: 1;
`;

const TreeItem = ({
  children,
  icon,
  actions = [],
  uniqueId = null,
  title = "Tree Item",
  defaultOpen = false,
  leaf = false,
  disabled = false,
  button = false,
  highlight = false,
  highlightNow = false,
  deletable = false,
  deleteInline = false,
  duplicatable = false,
  duplicateInline = false,
  frameable = false,
  frameInline = false,
  renameable = false,
  renameInline = false,
  onDelete = null,
  onDuplicate = null,
  onFrame = null,
  onRename = null,
  ...props
}) => {
  const { closeFolder, openFolder, openFolders, projectId } = useContext(ProjectContext);
  const numChildren = useRef(React.Children.count(children));
  const hasChildren = numChildren.current > 0;
  const id = uniqueId !== null
    ? `${title.toLowerCase().replaceAll(" ", "-")}-${uniqueId}`
    : title.toLowerCase().replaceAll(" ", "-");
  const [open, setOpen] = useState(defaultOpen);
  const [renaming, setRenaming] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(highlight);
  const [isNowHighlighted, setIsNowHighlighted] = useState(highlightNow);

  useEffect(() => {
    // Open collapse when children count changes
    const newChildCount = React.Children.count(children);
    if (newChildCount > numChildren.current && !leaf) {
      setOpen(true);
      openFolder(id);
      numChildren.current = newChildCount;
    } else if (openFolders[projectId] !== undefined) {
      if (openFolders[projectId].includes(id)) {
        setOpen(true);
      } else if (defaultOpen) {
        openFolder(id);
      } else {
        setOpen(false);
      }
    }
  }, [children, leaf, openFolder, id, openFolders, projectId, defaultOpen]);

  useEffect(() => {
    if (disabled) {
      setOpen(false);
    }
  }, [disabled, closeFolder]);

  // Custom hook to not show the highlights on first render
  // This will still show the highlights in development.
  useOnUpdate(() => {
    if(isHighlighted) {
      setTimeout(() => {
        // TODO Add test in Workflows Modal
        setIsHighlighted(false);
      }, 2500)
    }
  }, [isHighlighted]);

  useEffect(() => {
    if (highlightNow) {
      setIsNowHighlighted(true);
    } else {
      setIsNowHighlighted(false);
    }
  }, [highlightNow]);

  if (leaf && hasChildren) {
    throw new Error(
      `Leaf Tree Items should not have child elements, ` +
        `but ${numChildren.current} ${numChildren.current === 1 ? "child" : "children"} found!`
    );
  }

  let inlineActions = [];
  let contextActions = [];

  // Open and Close function
  const handleOpen = () => {
    setOpen(!open);
    if (open) {
      closeFolder(id);
    } else {
      openFolder(id);
    }
  }

  // Setup Frame capability
  const handleFrame = () => {
    onFrame();
  };

  if (frameable) {
    const frameAction = (
      <FrameAction
        key="frame"
        inline={frameInline}
        onClick={handleFrame}
        disabled={disabled}
      />
    );
    if (frameInline) {
      inlineActions.push(frameAction);
    } else {
      contextActions.push(frameAction);
    }
  }

  // Add divider between frame action and rename and delete
  if (
    frameable &&
    !frameInline &&
    (renameable || deletable) &&
    !(renameInline && deleteInline)
  ) {
    // Add divider between rename and/or delete and frame
    contextActions.push(
      <Dropdown.Divider key="divider-1" data-testid="divider-1" />
    );
  }

  // Setup Rename capability
  const handleRenameSave = (newName) => {
    onRename(newName);
    setRenaming(false);
  };

  const handleRenameCancel = () => {
    setRenaming(false);
  };

  if (renameable) {
    const renameAction = (
      <RenameAction
        key="rename"
        inline={renameInline}
        onClick={() => {
          setRenaming(true);
        }}
        disabled={disabled}
      />
    );
    if (renameInline) {
      inlineActions.push(renameAction);
    } else {
      contextActions.push(renameAction);
    }
  }

  // Setup Delete capability
  const handleDelete = () => {
    onDelete();
  };

  if (deletable) {
    const deleteAction = (
      <DeleteAction
        key="delete"
        inline={deleteInline}
        onClick={handleDelete}
        disabled={disabled}
      />
    );
    if (deleteInline) {
      inlineActions.push(deleteAction);
    } else {
      contextActions.push(deleteAction);
    }
  }

  const handleDuplicate = () => {
    onDuplicate();
  };

  if (duplicatable) {
    const duplicateAction = (
      <DuplicateAction
        key="duplicate"
        inline={duplicateInline}
        onClick={handleDuplicate}
        disabled={disabled}
      />
    );
    if (duplicateInline) {
      inlineActions.push(duplicateAction);
    } else {
      contextActions.push(duplicateAction);
    }
  }

  let contextMenuDividerAdded = false;
  for (let action of actions) {
    // Handle inline actions
    if (action.props.inline) {
      inlineActions.push(action);
    }
    // Place actions in the context menu by default
    else {
      // Add a dropdown divider between default actions and custom actions
      if (contextActions.length > 0 && !contextMenuDividerAdded) {
        contextActions.push(
          <Dropdown.Divider key="divider-2" data-testid="divider-2" />
        );
        contextMenuDividerAdded = true;
      }
      contextActions.push(action);
    }
  }

  return (
    <TreeItemContainer
      onClick={props.onClick}
      data-testid={`${id}-tree-item-container`}
      highlight={isHighlighted || isNowHighlighted}
      button={button}
      disabled={disabled}
      {...props}
    >
      <TreeItemHeader>
        <TreeItemHeaderLeft width={renaming || (inlineActions.length === 0 && contextActions.length === 0) ? "100%" : "80%"}>
          {!leaf && (
            <CollapseToggleButton
              open={open}
              onClick={handleOpen}
              disabled={!hasChildren || disabled}
              aria-controls={`${id}-tree-item-content`}
              aria-expanded={open}
            />
          )}
          {leaf && (
            <TreeItemPadding title={title} data-testid={"tree-item-child"} role="tree-item-child" />
          )}
          {icon && (
            <TreeItemIcon className="me-1" data-testid="tree-item-icon">
              {icon}
            </TreeItemIcon>
          )}
          {!renaming ? (
            <TreeItemTitle title={title}>{title}</TreeItemTitle>
          ) : (
            <InlineTextControl
              defaultValue={title}
              onSave={handleRenameSave}
              onCancel={handleRenameCancel}
              placeholder="Required"
              pattern="^(?!\s*$).+"
              required
            />
          )}
        </TreeItemHeaderLeft>
        {/* Hide the right action buttons when renaming in progress */}
        {!renaming && (
          <TreeItemHeaderRight>
            {/* Action buttons to right of the title */}
            {inlineActions}
            {/* Options menu */}
            {contextActions.length > 0 && (
              <ContextMenu buttonTitle={`Options for ${title}`} disabled={disabled}>
                {contextActions}
              </ContextMenu>
            )}
          </TreeItemHeaderRight>
        )}
      </TreeItemHeader>
      <Collapse in={open}>
        {/* This div needs to be unstyled to allow for smooth animation when panel opens and closes */}
        <div className="smooth-animation">
          <TreeItemContent
            id={`${id}-tree-item-content`}
            data-testid={`${id}-tree-item-content`}
          >
            {children}
          </TreeItemContent>
        </div>
      </Collapse>
    </TreeItemContainer>
  );
};

TreeItem.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
  uniqueId: matchesUUID,
  actions: PropTypes.arrayOf(PropTypes.object),
  defaultOpen: PropTypes.bool,
  deletable: PropTypes.bool,
  deleteInline: PropTypes.bool,
  duplicatable: PropTypes.bool,
  duplicateInline: PropTypes.bool,
  frameable: PropTypes.bool,
  frameInline: PropTypes.bool,
  icon: PropTypes.element,
  leaf: PropTypes.bool,
  button: PropTypes.bool,
  disabled: PropTypes.bool,
  renameable: PropTypes.bool,
  renameInline: PropTypes.bool,
  onDelete: PropTypes.func,
  onDuplicate: PropTypes.func,
  onFrame: PropTypes.func,
  onRename: PropTypes.func,
  title: PropTypes.string,
  highlight: PropTypes.bool,
  highlightNow: PropTypes.bool,
  onClick: PropTypes.func,
};

export default TreeItem;
