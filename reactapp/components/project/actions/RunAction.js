import PropTypes from "prop-types";
import { BsFillPlayFill } from "react-icons/bs";

import Action from "components/actions/Action";

const RunAction = ({ title = "Run", ...props }) => {
  return <Action title={title} icon={<BsFillPlayFill />} {...props} />;
};

RunAction.propTypes = {
  title: PropTypes.string,
};

export default RunAction;
