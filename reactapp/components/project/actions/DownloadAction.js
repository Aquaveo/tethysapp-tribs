import PropTypes from "prop-types";
import { BsDownload } from "react-icons/bs";

import Action from "components/actions/Action";

const DownloadAction = ({ datasetId, scenarioId, realizationId, layer, title = "Download", ...props }) => {
  const handleClick = () => {
    const query = layer
      ? `tab_action=download_layer&layer=${encodeURIComponent(layer)}`
      : `tab_action=download_all`;
    // Each resource type exposes its download action on a different details tab
    let path;
    if (realizationId) {
      path = `realizations/${realizationId}/details/datasets/`;
    } else if (scenarioId) {
      path = `scenarios/${scenarioId}/details/datasets/`;
    } else if (datasetId) {
      path = `datasets/${datasetId}/details/files/`;
    }
    window.location.href = process.env.TETHYS_APP_ROOT_URL + `${path}?${query}`;
  };
  return <Action title={title} icon={<BsDownload />} onClick={handleClick} {...props} />;
};

DownloadAction.propTypes = {
  datasetId: PropTypes.string,
  scenarioId: PropTypes.string,
  realizationId: PropTypes.string,
  title: PropTypes.string,
  layer: PropTypes.string,
};

export default DownloadAction;
