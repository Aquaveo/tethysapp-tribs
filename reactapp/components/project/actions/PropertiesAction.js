import PropTypes from "prop-types";
import { BsListUl } from "react-icons/bs";

import Action from "components/actions/Action";

const PropertiesAction = ({ title = "Properties", ...props }) => {
  return <Action title={title} icon={<BsListUl />} {...props} />;
};

PropertiesAction.propTypes = {
  title: PropTypes.string,
};

export default PropertiesAction;
