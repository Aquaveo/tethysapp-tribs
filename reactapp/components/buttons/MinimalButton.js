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

  &:active {
    background-color: #dfdfdf;
  }
`;

const MinimalButton = ({ children, className = "", size = "", ...props }) => {
  const bootstrapClasses = size !== "sm" ? "btn" : "btn btn-sm";
  return (
    <MinimallyStyledButton
      className={
        !className ? bootstrapClasses : `${bootstrapClasses} ${className}`
      }
      {...props}
    >
      {children}
    </MinimallyStyledButton>
  );
};

MinimalButton.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
  size: PropTypes.oneOf(["sm"]),
  className: PropTypes.string,
};

export default MinimalButton;
