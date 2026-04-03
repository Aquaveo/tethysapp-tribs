import PropTypes from "prop-types";
import { BsMenuButtonWide } from "react-icons/bs";

import Action from "components/actions/Action";

const LegendsAction = ({ title = "Legends", ...props }) => {
  return <Action title={title} icon={<BsMenuButtonWide />} {...props} />;
};

LegendsAction.propTypes = {
  title: PropTypes.string,
};

export default LegendsAction;
