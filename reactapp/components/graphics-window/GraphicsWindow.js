import PropTypes from "prop-types";
import { useContext } from "react";
import { Viewer, CameraFlyTo } from "resium";
import {
  Ion,
  IonWorldImageryStyle,
  Rectangle,
  createWorldTerrainAsync,
} from "cesium";
import "cesium/Source/Widgets/widgets.css";
import { toast } from "react-toastify";

import {
  AppContext,
  GraphicsWindowVisualsContext,
  SidePanelContext,
} from "react-tethys/context";
import CustomCamera from "./CustomCamera";
import {
  DATASET_VIZ_TYPES,
  FRAME_OBJECT,
  HOME,
} from "constants/GraphicsWindowConstants";
import CompoundWmsLayer from "./CompoundWmsLayers";
import GltfLayer from "./GltfLayers";
import WmsLayer from "./WmsLayers";
import CzmlLayer from "./CzmlLayers";

const GraphicsWindow = ({ datasets }) => {
  const { tethysApp } = useContext(AppContext);
  const {
    framedObject,
    setFramedObject,
    zoomToExtent,
    setZoomToExtent,
    setSelectedCZMLPoint,
  } = useContext(GraphicsWindowVisualsContext);
  const { showPanel } = useContext(SidePanelContext);

  Ion.defaultAccessToken = tethysApp.customSettings.Cesium_API_Key.value;
  const terrain_provider = createWorldTerrainAsync({
    requestVertexNormals: true,
    requestWaterMask: true,
    style: IonWorldImageryStyle.AERIAL_WITH_LABELS,
  });

  const handleComplete = () => {
    setFramedObject(null, FRAME_OBJECT);
    setZoomToExtent(null);
  };

  const handleSelectedEntityChange = (entity) => {
    if (entity !== undefined && !["None", "Loading..."].includes(entity?.id)) {
      setSelectedCZMLPoint(entity.id);
      const datasetId = entity.id.match(/\[(.*?)\]/)[1]; // This grabs any string inbetween brackets "[" or "]"
      showPanel(`plotly-panel-${datasetId}`);
    } else if (["None", "Loading..."].includes(entity.id)) {
      const match = entity.id.match(/\[(.*?)\]/);

      if (match && match[1]) {
        const datasetId = match[1];
        showPanel(`plotly-panel-${datasetId}`);
      } else {
        console.error("This dataset is not set up to show a plot panel");
      }
      setSelectedCZMLPoint(null);
    }
  };

  const handleTrackedEntityChange = (entity) => {
    if (entity !== undefined) {
      setSelectedCZMLPoint(entity.id.split("_")[1]);
    }
  };

  return (
    <Viewer
      full
      style={{ top: "50px" }}
      defaultAccessToken={Ion}
      terrainProvider={terrain_provider}
      onSelectedEntityChange={handleSelectedEntityChange}
      onTrackedEntityChange={handleTrackedEntityChange}
    >
      <CustomCamera />
      {zoomToExtent !== null &&
        zoomToExtent === HOME &&
        framedObject?.[zoomToExtent] !== undefined && (
          <CameraFlyTo
            destination={Rectangle.fromDegrees(...framedObject[zoomToExtent])}
            onComplete={handleComplete}
          />
        )}
      {zoomToExtent !== null &&
        zoomToExtent === FRAME_OBJECT &&
        framedObject?.[zoomToExtent] !== undefined && (
          <CameraFlyTo
            destination={(() => {
              const [min_x, min_y, max_x, max_y] = framedObject[FRAME_OBJECT];
              const width = max_x - min_x;
              const height = max_y - min_y;
              const buffer_width = 0.5 * width;
              const buffer_height = 0.5 * height;
              const expanded_min_x = min_x - buffer_width;
              const expanded_min_y = min_y - buffer_height;
              const expanded_max_x = max_x + buffer_width;
              const expanded_max_y = max_y + buffer_height;
              return Rectangle.fromDegrees(
                expanded_min_x,
                expanded_min_y,
                expanded_max_x,
                expanded_max_y
              );
            })()}
            onComplete={handleComplete}
          />
        )}
      {Object.values(datasets)
        .reverse()
        .map((dataset_array) => {
          if (dataset_array?.name === "Mesh Data") {
            dataset_array = dataset_array.datasets;
          }
          return dataset_array
            .slice(0)
            .reverse()
            .map((dataset, i) => {
              if (dataset.viz === undefined) {
                return null;
              }
              if (dataset.viz.type === DATASET_VIZ_TYPES.GLTF) {
                return (
                  <GltfLayer
                    key={`gltf-layer-${dataset.id}`}
                    dataset={dataset}
                    datasetIndex={i}
                  />
                );
              } else if (dataset.viz.type === DATASET_VIZ_TYPES.WMS) {
                return (
                  <WmsLayer
                    key={`wms-layer-${dataset.id}`}
                    dataset={dataset}
                    datasetIndex={i}
                  />
                );
              } else if (dataset.viz.type === DATASET_VIZ_TYPES.WMS_COMPOUND) {
                return (
                  <CompoundWmsLayer
                    key={`compound-wms-layer-${dataset.id}`}
                    dataset={dataset}
                  />
                );
              } else if (dataset.viz.type === DATASET_VIZ_TYPES.CZML) {
                return (
                  <CzmlLayer
                    key={`czml-layer-${dataset.id}`}
                    dataset={dataset}
                    datasetIndex={i}
                  />
                );
              }
              toast.error(
                `This dataset's viz type is not handled. Dataset Id: ${dataset.id} Type: ${dataset.viz.type}`,
                {
                  position: "top-right",
                  autoClose: 3000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  progress: undefined,
                }
              );
              return null;
            });
        })}
    </Viewer>
  );
};

GraphicsWindow.propTypes = {
  datasets: PropTypes.object, // This gets checked before the datasets gets populated unfortunately :/
};

export default GraphicsWindow;
