import { useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { datasetPropTypes } from "components/tree/propTypes";
import { Model } from "resium";
import { Cartesian3, Transforms } from "cesium";
import { GraphicsWindowVisualsContext, ProjectContext } from "react-tethys/context";
import extractLayerName from "lib/extractLayerName";

const GltfLayer = ({ dataset, datasetIndex }) => {
  const TETHYS_MEDIA_URL = process.env.TETHYS_MEDIA_URL;
  const { visibleObjects, visibleCZMLObject } = useContext(GraphicsWindowVisualsContext);
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

  const gltf_origin = dataset.viz.origin;
  if (!gltf_origin) return null;  // TODO: add warning icon to dataset to indicate issue
  let show = false;
  if (visibleObjects[projectId] !== undefined) {
    show = visibleObjects[projectId].includes(dataset.id)
  }

  if (dataset?.viz?.url && dataset?.viz?.url.length > 1) {
    const dataset_url = dataset?.viz?.url[visibleLayerIndex];
    const gltf_url = TETHYS_MEDIA_URL + dataset_url;
    const layerName = extractLayerName(dataset_url, dataset.id);

    const enu_matrix = Transforms.northUpEastToFixedFrame(
      Cartesian3.fromDegrees(...gltf_origin)
    );
    return (
      <Model
        key={`graphics-model-${dataset.id}-${layerName}-${visibleLayerIndex}`}
        url={gltf_url}
        modelMatrix={enu_matrix}
        minimumPixelSize={10}
        show={show}
      />
    );
  } else {
    const gltf_url = TETHYS_MEDIA_URL + dataset?.viz?.url[0]
    const enu_matrix = Transforms.northUpEastToFixedFrame(
      Cartesian3.fromDegrees(...gltf_origin)
    );

  return (
      <Model
        key={`graphics-model-${dataset.id}`}
        url={gltf_url}
        modelMatrix={enu_matrix}
        minimumPixelSize={10}
        show={show}
      />
    );
  }
};

GltfLayer.propTypes = {
  dataset: datasetPropTypes.isRequired,
  datasetIndex: PropTypes.number,
};

export default GltfLayer;
