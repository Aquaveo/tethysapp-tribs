import PropTypes from "prop-types";
import { BsCopy } from "react-icons/bs";

import Action from "components/actions/Action";

const DuplicateAction = ({ title = "Duplicate", ...props }) => {
  return <Action title={title} icon={<BsCopy />} {...props} />;
};

DuplicateAction.propTypes = {
  title: PropTypes.string,
};

export default DuplicateAction;
