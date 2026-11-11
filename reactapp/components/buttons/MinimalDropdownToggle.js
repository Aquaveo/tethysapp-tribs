import PropTypes from "prop-types";
import React from "react";

import { MinimallyStyledButton } from "components/buttons/MinimalButton";

/**
 * A Dropdown.Toggle rendered as a minimal icon button (`<Dropdown.Toggle as={MinimalDropdownToggle}>`). It keeps
 * the id and aria attributes the Dropdown gives it but sets its own classes, so Bootstrap's "dropdown-toggle"
 * caret is not drawn next to the icon.
 */
const MinimalDropdownToggle = React.forwardRef(({ onClick, children, ...props }, ref) => (
  <MinimallyStyledButton
    ref={ref}
    type="button"
    onClick={(evt) => {
      evt.preventDefault();
      onClick(evt);
    }}
    {...props}
    className="btn btn-sm"
  >
    {children}
  </MinimallyStyledButton>
));
MinimalDropdownToggle.displayName = "MinimalDropdownToggle";
MinimalDropdownToggle.propTypes = { onClick: PropTypes.func, children: PropTypes.node };

export default MinimalDropdownToggle;
