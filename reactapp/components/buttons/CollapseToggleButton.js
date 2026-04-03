import styled from "styled-components";
import PropTypes from "prop-types";
import { BsChevronDown } from "react-icons/bs";

import MinimalButton from "components/buttons/MinimalButton";

const RotatingChevron = styled(BsChevronDown)`
  transition: transform 0.25s;

  &.rotate {
    transform: rotate(-90deg);
  }
`;

const CollapseToggleButton = ({
  closedTitle = "Expand",
  size = "sm",
  open = true,
  openedTitle = "Shrink",
  onClick,
  ...props
}) => {
  const handleClick = () => {
    onClick && onClick();
  };
  return (
    <MinimalButton
      size={size}
      className="me-1"
      title={open ? openedTitle : closedTitle}
      onClick={handleClick}
      aria-expanded={open}
      {...props}
    >
      <RotatingChevron className={!open ? "rotate" : ""} />
    </MinimalButton>
  );
};

CollapseToggleButton.propTypes = {
  closedTitle: PropTypes.string,
  size: PropTypes.oneOf(["sm", "lg", ""]),
  open: PropTypes.bool,
  openedTitle: PropTypes.string,
  onClick: PropTypes.func,
};

export default CollapseToggleButton;
