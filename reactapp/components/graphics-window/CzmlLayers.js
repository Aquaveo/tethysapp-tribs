import { useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { datasetPropTypes } from "components/tree/propTypes";
import { CzmlDataSource } from "resium";
import { Color } from "cesium";
import { GraphicsWindowVisualsContext, ProjectContext } from "react-tethys/context";
import useLayerValues from "hooks/useLayerValues";
import { rampColor, resolveRampName } from "lib/colorRamps";
import extractLayerName from "lib/extractLayerName";
import { findValueVariable, hasValues, normalize, rowIndexForTime } from "lib/layerValues";

// A feature without a value (as the backend draws features before they are colored)
const NO_VALUE_BYTES = [160, 160, 160];
const POLYGON_ALPHA = 175;

/** The Cesium color of a value on a ramp; gray when there is no value. */
export function featureColor(rampName, value, variable, alpha = 255) {
  const t = normalize(value, variable?.min, variable?.max);
  if (t === null) return Color.fromBytes(...NO_VALUE_BYTES, alpha);
  const { r, g, b } = rampColor(rampName, t);
  return Color.fromBytes(r, g, b, alpha);
}

/** Color the features of a loaded value layer with their values of one row. Returns how many were colored. */
export function colorFeatures(dataSource, values, row, rampName, variable) {
  let colored = 0;
  values.ids.forEach((id, i) => {
    const entity = dataSource.entities.getById(id);
    if (!entity) return;
    const value = values.values[i]?.[row] ?? null;
    if (entity.point) {
      entity.point.color = featureColor(rampName, value, variable);
      colored += 1;
    } else if (entity.polygon) {
      entity.polygon.material = featureColor(rampName, value, variable, POLYGON_ALPHA);
      colored += 1;
    }
  });
  return colored;
}

/** Give every feature of a loaded value layer the no-value color. */
export function clearFeatureColors(dataSource) {
  dataSource.entities.values.forEach((entity) => {
    if (entity.point) {
      entity.point.color = featureColor(null, null, null);
    } else if (entity.polygon) {
      entity.polygon.material = featureColor(null, null, null, POLYGON_ALPHA);
    }
  });
}

/**
 * A value layer (node, outlet or basin output): one CZML document with the features, colored here from the values
 * file of the selected variable at the clock time, on the dataset's color ramp. The document is loaded once, so a
 * selected feature stays selected when the variable, the ramp or the time changes.
 */
const CzmlValueLayer = ({ dataset }) => {
  const TETHYS_MEDIA_URL = process.env.TETHYS_MEDIA_URL;
  const { visibleCZMLObject, visibleObjects, meshClockTime, colorRamps } = useContext(GraphicsWindowVisualsContext);
  const { projectId } = useContext(ProjectContext);
  const [dataSource, setDataSource] = useState(null);

  const variable = findValueVariable(dataset, visibleCZMLObject?.[dataset.id]);
  const values = useLayerValues(variable ? TETHYS_MEDIA_URL + variable.values : null);
  const rampName = resolveRampName(dataset, colorRamps);

  useEffect(() => {
    if (!dataSource) return;
    if (!values || !variable || values.variable !== variable.name) {
      // No values (yet) for the selected variable: never leave the colors of the previous one under its legend
      clearFeatureColors(dataSource);
      return;
    }
    colorFeatures(dataSource, values, rowIndexForTime(values, meshClockTime), rampName, variable);
  }, [dataSource, values, variable, rampName, meshClockTime]);

  const url = dataset.viz.url?.[0];
  if (!url) return null;
  const shown = Boolean(visibleObjects?.[projectId]?.includes(dataset.id));

  return (
    <CzmlDataSource
      key={`czml-values-${dataset.id}-${url}`}
      data={TETHYS_MEDIA_URL + url}
      show={shown && Boolean(variable)}
      onLoad={setDataSource}
    />
  );
};

CzmlValueLayer.propTypes = {
  dataset: datasetPropTypes.isRequired,
};

/** CZML written with its colors: one document per layer (station data, and output visualized before value layers). */
const CzmlFileLayer = ({ dataset }) => {
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

  if (dataset?.viz?.url && dataset?.viz?.url.length >= 1) { // a qout dataset may have a single (Qstrm) layer
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

CzmlFileLayer.propTypes = {
  dataset: datasetPropTypes.isRequired,
};

const CzmlLayer = ({ dataset }) => (
  hasValues(dataset) ? <CzmlValueLayer dataset={dataset} /> : <CzmlFileLayer dataset={dataset} />
);

CzmlLayer.propTypes = {
  dataset: datasetPropTypes.isRequired,
  datasetIndex: PropTypes.number,
};

export default CzmlLayer;
