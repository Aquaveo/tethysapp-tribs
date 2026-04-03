import PropTypes from "prop-types";
import { BsFullscreen } from "react-icons/bs";

import Action from "components/actions/Action";

const FrameAction = ({ title = "Frame", ...props }) => {
  return <Action title={title} icon={<BsFullscreen />} {...props} />;
};

FrameAction.propTypes = {
  title: PropTypes.string,
};

export default FrameAction;
