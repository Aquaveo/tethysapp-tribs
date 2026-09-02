import PropTypes from "prop-types";
import { BsDownload } from "react-icons/bs";

import Action from "components/actions/Action";

const DownloadAction = ({ datasetId, layer, title = "Download", ...props }) => {
  const handleClick = () => {
    const query = layer
      ? `tab_action=download_layer&layer=${encodeURIComponent(layer)}`
      : `tab_action=download_all`;
    window.location.href =
      process.env.TETHYS_APP_ROOT_URL +
      `datasets/${datasetId}/details/files/?${query}`;
  };
  return <Action title={title} icon={<BsDownload />} onClick={handleClick} {...props} />;
};

DownloadAction.propTypes = {
  datasetId: PropTypes.string.isRequired,
  title: PropTypes.string,
  layer: PropTypes.string
};

export default DownloadAction;
