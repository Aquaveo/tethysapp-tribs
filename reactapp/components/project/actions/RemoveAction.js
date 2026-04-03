import PropTypes from "prop-types";
import { BsX } from "react-icons/bs";

import Action from "components/actions/Action";

const RemoveAction = ({ title = "Remove", ...props }) => {
  return <Action title={title} icon={<BsX />} {...props} />;
};

RemoveAction.propTypes = {
  title: PropTypes.string,
};

export default RemoveAction;
