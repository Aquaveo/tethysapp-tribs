import Dropdown from "react-bootstrap/Dropdown";
import PropTypes from "prop-types";
import React from "react";
import { BsThreeDots } from "react-icons/bs";

import { MinimallyStyledButton } from "components/buttons/MinimalButton";

const MinimalDropdownToggle = React.forwardRef(
  ({ onClick, children, title, disabled }, ref) => (
    <MinimallyStyledButton
      ref={ref}
      className="btn btn-sm"
      title={title}
      disabled={disabled}
      onClick={(evt) => {
        evt.preventDefault();
        onClick(evt);
      }}
    >
      {children}
    </MinimallyStyledButton>
  )
);

MinimalDropdownToggle.displayName = "MinimalDropdownToggle";
MinimalDropdownToggle.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
  onClick: PropTypes.func,
  title: PropTypes.string,
  disabled: PropTypes.bool,
};

const ContextMenu = ({
  children,
  buttonTitle = "Menu",
  drop = "end",
  icon = <BsThreeDots />,
  disabled = false,
}) => {
  return (
    <Dropdown>
      <Dropdown.Toggle
        as={MinimalDropdownToggle}
        drop={drop}
        title={buttonTitle}
        disabled={disabled}
      >
        {icon}
      </Dropdown.Toggle>
      <Dropdown.Menu>{children}</Dropdown.Menu>
    </Dropdown>
  );
};

ContextMenu.propTypes = {
  buttonTitle: PropTypes.string,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
  drop: PropTypes.oneOf(["start", "end", "top", "bottom"]),
  icon: PropTypes.element,
  disabled: PropTypes.bool,
};

export default ContextMenu;
