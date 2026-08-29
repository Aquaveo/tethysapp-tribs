import PropTypes from "prop-types";
import { BsDownload } from "react-icons/bs";

import Action from "components/actions/Action";

const DownloadAction = ({ title = "Download", ...props }) => {
  return <Action title={title} icon={<BsDownload />} {...props} />;
};

DownloadAction.propTypes = {
  title: PropTypes.string,
};

export default DownloadAction;
