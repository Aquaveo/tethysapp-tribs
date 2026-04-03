import PropTypes from "prop-types";
import { BsPlus } from "react-icons/bs";

import Action from "components/actions/Action";

const AddAction = ({ title = "Add", ...props }) => {
  return <Action title={title} icon={<BsPlus />} {...props} />;
};

AddAction.propTypes = {
  title: PropTypes.string,
};

export default AddAction;
