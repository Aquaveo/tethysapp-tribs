import PropTypes from "prop-types";
import { BsFolderSymlink } from "react-icons/bs";

import Action from "components/actions/Action";

const DetailsAction = ({ title = "Details", ...props }) => {
  return <Action title={title} icon={<BsFolderSymlink />} {...props} />;
};

DetailsAction.propTypes = {
  title: PropTypes.string,
};

export default DetailsAction;
