import PropTypes from "prop-types";
import { BsLink } from "react-icons/bs";

import Action from "components/actions/Action";

const LinkAction = ({ title = "Add Link", ...props }) => {
  return <Action title={title} icon={<BsLink />} {...props} />;
};

LinkAction.propTypes = {
  title: PropTypes.string,
};

export default LinkAction;
