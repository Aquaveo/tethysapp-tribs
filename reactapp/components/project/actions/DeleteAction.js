import PropTypes from "prop-types";
import { BsTrash } from "react-icons/bs";

import Action from "components/actions/Action";

const DeleteAction = ({ title = "Delete", ...props }) => {
  return <Action title={title} icon={<BsTrash />} {...props} />;
};

DeleteAction.propTypes = {
  title: PropTypes.string,
};

export default DeleteAction;
