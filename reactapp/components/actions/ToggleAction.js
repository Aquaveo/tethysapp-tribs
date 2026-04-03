import PropTypes from "prop-types";
import { useState, useEffect } from "react";

import Action from "components/actions/Action";

const ToggleAction = ({
  onTitle,
  onIcon,
  offTitle,
  offIcon,
  onClick,
  off = false,
  inline = false,
  ...props
}) => {
  const [on, setOn] = useState(!off);
  const handleClick = (evt) => {
    setOn(!on);
    if (onClick) {
      onClick(evt, !on);
    }
  };

  useEffect(() => {
    setOn(!off);
  }, [off]);

  return (
    <Action
      icon={on ? onIcon : offIcon}
      onClick={(evt) => handleClick(evt)}
      title={on ? onTitle : offTitle}
      inline={inline}
      {...props}
    />
  );
};

ToggleAction.propTypes = {
  onTitle: PropTypes.string,
  onIcon: PropTypes.element.isRequired,
  offTitle: PropTypes.string,
  offIcon: PropTypes.element.isRequired,
  onClick: PropTypes.func,
  off: PropTypes.bool,
  inline: PropTypes.bool,
};

export default ToggleAction;
