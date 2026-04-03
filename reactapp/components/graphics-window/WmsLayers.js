import { useContext } from "react";
import PropTypes from "prop-types";
import { datasetPropTypes } from "components/tree/propTypes";
import { ImageryLayer } from "resium";
import { WebMapServiceImageryProvider } from "cesium";
import { GraphicsWindowVisualsContext, ProjectContext } from "react-tethys/context";

const WmsLayer = ({ dataset, datasetIndex }) => {
  const { visibleObjects } = useContext(GraphicsWindowVisualsContext);
  const { projectId } = useContext(ProjectContext)
  const env_str = dataset.viz?.env_str ? dataset.viz?.env_str : null;

  const imagery = new WebMapServiceImageryProvider({
    url: dataset.viz.url,
    layers: dataset.viz.layer,
    parameters: {
      transparent: "true",
      format: "image/png",
      ...(env_str && {env: env_str}) // Only add the env if it's defined.
    }
  });

  let show = false;
  if (visibleObjects[projectId] !== undefined) {
    show = visibleObjects[projectId].includes(dataset.id)
  }

  return (
    <ImageryLayer
      key={`imagery-layer-${datasetIndex}`}
      imageryProvider={imagery}
      show={show}
    />
  );
};

WmsLayer.propTypes = {
  dataset: datasetPropTypes.isRequired,
  datasetIndex: PropTypes.number,
};

export default WmsLayer;
