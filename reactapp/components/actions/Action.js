import PropTypes from "prop-types";
import Dropdown from "react-bootstrap/Dropdown";

import MinimalButton from "components/buttons/MinimalButton";

const Action = ({ title, icon, inline = false, ...props }) => {
  if (inline) {
    return (
      <MinimalButton size="sm" title={title} {...props}>
        {icon}
      </MinimalButton>
    );
  } else {
    return (
      <Dropdown.Item as="button" {...props}>
        {icon} {title}
      </Dropdown.Item>
    );
  }
};

Action.propTypes = {
  title: PropTypes.string,
  icon: PropTypes.element.isRequired,
  inline: PropTypes.bool,
};

export default Action;
