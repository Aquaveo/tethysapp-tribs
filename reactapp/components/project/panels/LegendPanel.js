import PropTypes from "prop-types";
import SlideSheet from "components/dialogs/SlideSheet";
import { datasetPropTypes } from "components/tree/propTypes";
import { DATASET_VIZ_TYPES } from "constants/GraphicsWindowConstants";
import { useContext } from "react";
import { SidePanelContext } from "react-tethys/context";

const LegendPanel = ({
  title = "Legend",
  placement = "end",
  panelId,
  dataset,
  uniqueId,
  ...props
}) => {
  const TETHYS_MEDIA_URL = process.env.TETHYS_MEDIA_URL;
  const { hideSidePanel, visibleSidePanel } = useContext(SidePanelContext);

  let slideSheetTitle = title;
  let legend_urls = dataset.viz.legend.length > 1
    ? dataset.viz.legend.filter((legend_url) => legend_url.includes(uniqueId))
    : dataset.viz.legend;

  if (
    dataset?.viz?.type === DATASET_VIZ_TYPES.CZML ||
    dataset?.viz?.type === DATASET_VIZ_TYPES.GLTF
  ) {
    legend_urls = legend_urls.map((url) => TETHYS_MEDIA_URL + url);
  }

  if (
    dataset?.viz?.type === DATASET_VIZ_TYPES.CZML
  ) {
    const uniqueName = uniqueId ? uniqueId.replace("_[]", "").split('_').slice(1).join("") : null;
    slideSheetTitle = `${uniqueName} ${title}`;
  } else if (dataset?.viz?.type === DATASET_VIZ_TYPES.WMS_COMPOUND) {
    const uniqueName = uniqueId ? uniqueId.split('_').slice(1).join("") : null;
    slideSheetTitle = `${uniqueName} ${title}`;
  } else {
    slideSheetTitle = `${dataset.name} ${title}`
  }

  const handleClose = () => {
    hideSidePanel(panelId);
  };

  return (
    <SlideSheet
      title={slideSheetTitle}
      show={visibleSidePanel.includes(panelId)}
      placement={placement}
      onClose={handleClose}
      style={{ height: "fit-content" }}
    >
      <div>
        {legend_urls.map((legend_url, i) => {
          let final_url = legend_url;
          if (legend_url.includes("geoserver/wms")) {
            const layerName = legend_url.split("LAYER=")[1].replace(`${dataset.id}_`, "");
            let env_str = dataset.viz?.env_str ? dataset.viz?.env_str : null;
            if (env_str?.[layerName]) {
              env_str = encodeURIComponent(env_str?.[layerName]);
              final_url = `${final_url}&ENV=${env_str}`
            } else if (env_str) {
              env_str = encodeURIComponent(env_str);
              final_url = `${final_url}&ENV=${env_str}`
            }
          }

          return (
            <img
              key={`${uniqueId}-${i}`}
              alt={`${uniqueId} ${title}`}
              src={`${final_url}`}
              style={{ maxWidth: "100%" }}
            />
          );
        })}
      </div>
    </SlideSheet>
  );
};

LegendPanel.propTypes = {
  title: PropTypes.string,
  placement: PropTypes.oneOf(["start", "end", "top", "bottom"]),
  uniqueId: PropTypes.string.isRequired,
  panelId: PropTypes.string.isRequired,
  dataset: datasetPropTypes.isRequired,
};

export default LegendPanel;
