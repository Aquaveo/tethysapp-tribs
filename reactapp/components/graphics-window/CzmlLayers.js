import { useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { datasetPropTypes } from "components/tree/propTypes";
import { CzmlDataSource } from "resium";
import { GraphicsWindowVisualsContext, ProjectContext } from "react-tethys/context";
import extractLayerName from "lib/extractLayerName";

const CzmlLayer = ({ dataset, datasetIndex }) => {
  const TETHYS_MEDIA_URL = process.env.TETHYS_MEDIA_URL;
  const { visibleCZMLObject, visibleObjects } = useContext(GraphicsWindowVisualsContext);
  const { projectId } = useContext(ProjectContext)

  const [visibleLayerIndex, setVisibleLayerIndex] = useState(0);

  useEffect(() => {
    const layerIndex = dataset?.viz?.url.findIndex((layer_url) => {
      const layerName = extractLayerName(layer_url, dataset.id);
      return visibleCZMLObject[dataset.id] === layerName;
    });
    if (layerIndex >= 0) {
      setVisibleLayerIndex(layerIndex)
    }
  }, [dataset.id, dataset?.viz?.url, visibleCZMLObject]);

  if (dataset?.viz?.url && dataset?.viz?.url.length > 1) {
    const dataset_url = dataset?.viz?.url[visibleLayerIndex];
    const layerName = extractLayerName(dataset_url, dataset.id);
    let show = false;
    if (visibleObjects[projectId] !== undefined) {
      show = visibleObjects[projectId].includes(dataset.id)
    }

    return (
      <CzmlDataSource
        key={`czml-dataset-${dataset.id}-${layerName}-${visibleLayerIndex}`}
        data={TETHYS_MEDIA_URL + dataset_url}
        show={visibleCZMLObject[dataset.id] === layerName && show}
      />
    );
  }
};

CzmlLayer.propTypes = {
  dataset: datasetPropTypes.isRequired,
  datasetIndex: PropTypes.number,
};

export default CzmlLayer;
