import PropTypes from "prop-types";
import { BsInputCursorText } from "react-icons/bs";

import Action from "components/actions/Action";

const RenameAction = ({ title = "Rename", ...props }) => {
  return <Action title={title} icon={<BsInputCursorText />} {...props} />;
};

RenameAction.propTypes = {
  title: PropTypes.string,
};

export default RenameAction;
