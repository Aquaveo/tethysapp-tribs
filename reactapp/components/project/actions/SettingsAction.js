import PropTypes from "prop-types";
import { BsFillGearFill } from "react-icons/bs";

import Action from "components/actions/Action";

const SettingsAction = ({ title = "Settings", ...props }) => {
  return <Action title={title} icon={<BsFillGearFill />} {...props} />;
};

SettingsAction.propTypes = {
  title: PropTypes.string,
};

export default SettingsAction;
