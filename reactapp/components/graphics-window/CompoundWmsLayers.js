import { useContext } from "react";
import { datasetPropTypes } from "components/tree/propTypes";
import { ImageryLayer } from "resium";
import { WebMapServiceImageryProvider } from "cesium";
import { GraphicsWindowVisualsContext, ProjectContext } from "react-tethys/context";

const CompoundWmsLayer = ({ dataset }) => {
  const { visibleObjects } = useContext(GraphicsWindowVisualsContext);
  const { projectId } = useContext(ProjectContext);

  return (
    dataset.viz.layer.slice(0).reverse().map((layer, compoundIndex) => {
      let env_str = dataset.viz?.env_str ? dataset.viz?.env_str : null;
      const layerName = layer.split("_")[1];
      if (env_str?.[layerName]) {
        env_str = env_str?.[layerName];
      }

      const imagery = new WebMapServiceImageryProvider({
        url: dataset.viz.url,
        layers: layer,
        parameters: {
          transparent: "true",
          format: "image/png",
          ...(env_str && {env: env_str}) // Only add the env if it's defined.
        }
      });
      let show = false;
      if (visibleObjects[projectId] !== undefined) {
        show = visibleObjects[projectId].includes(layer)
      }

      return (
        <ImageryLayer
          key={`compound-imagery-layer-${layer}-${compoundIndex}`}
          imageryProvider={imagery}
          show={show} // This is assuming that the layer name is unique
        />
      );
    })
  );
};

CompoundWmsLayer.propTypes = {
  dataset: datasetPropTypes.isRequired
};

export default CompoundWmsLayer;
