import React from "react";
import styled from "styled-components";
import PropTypes from "prop-types";

export const MinimallyStyledButton = styled.button`
  line-height: 1;
  padding: 0.375rem;

  &:focus,
  &:active {
    box-shadow: none;
  }

  &:hover {
    background-color: #efefef;
  }

  &:active,
  &[aria-pressed="true"] {
    background-color: #dfdfdf;
  }
`;

// forwardRef so overlays (tooltips) can anchor to the button
const MinimalButton = React.forwardRef(({ children, className = "", size = "", ...props }, ref) => {
  const bootstrapClasses = size !== "sm" ? "btn" : "btn btn-sm";
  return (
    <MinimallyStyledButton
      ref={ref}
      className={
        !className ? bootstrapClasses : `${bootstrapClasses} ${className}`
      }
      {...props}
    >
      {children}
    </MinimallyStyledButton>
  );
});
MinimalButton.displayName = "MinimalButton";

MinimalButton.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
  size: PropTypes.oneOf(["sm"]),
  className: PropTypes.string,
};

export default MinimalButton;
