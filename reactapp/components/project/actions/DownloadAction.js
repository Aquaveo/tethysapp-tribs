import PropTypes from "prop-types";
import { BsDownload } from "react-icons/bs";

import Action from "components/actions/Action";

const DownloadAction = ({ datasetId, title = "Download", ...props }) => {
  const handleClick = () => {
    window.location.href =
      process.env.TETHYS_APP_ROOT_URL +
      `datasets/${datasetId}/details/files/?tab_action=download_all`;
  };
  return <Action title={title} icon={<BsDownload />} onClick={handleClick} {...props} />;
};

DownloadAction.propTypes = {
  datasetId: PropTypes.string.isRequired,
  title: PropTypes.string,
};

export default DownloadAction;
