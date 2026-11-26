import { useContext, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { datasetPropTypes } from "components/tree/propTypes";
import { CzmlDataSource, Model } from "resium";
import { CallbackProperty, Cartesian3, Color, ColorMaterialProperty, Transforms } from "cesium";
import { makeSolidColorShader, setSolidColor } from "components/graphics-window/GltfLayers";
import { GraphicsWindowVisualsContext, ProjectContext } from "react-tethys/context";
import { useLayerValuesState } from "hooks/useLayerValues";
import { rampColor, resolveRampName } from "lib/colorRamps";
import extractLayerName from "lib/extractLayerName";
import { featureValue, findValueVariable, hasValues, normalize, rowIndexForTime } from "lib/layerValues";

// A feature without a value (as the backend draws features before they are colored)
const NO_VALUE_BYTES = [160, 160, 160];
const POLYGON_ALPHA = 175;
// The basin polygon under a mesh surface (see CzmlValueLayer): kept for its outline's place and its id, not to be seen
const HIDDEN_POLYGON_ALPHA = 1;

/** The Cesium color of a value on a ramp; gray when there is no value. */
export function featureColor(rampName, value, variable, alpha = 255) {
  const t = normalize(value, variable?.min, variable?.max);
  if (t === null) return Color.fromBytes(...NO_VALUE_BYTES, alpha);
  const { r, g, b } = rampColor(rampName, t);
  return Color.fromBytes(r, g, b, alpha);
}

// The color each value-layer polygon currently reads its fill from (see setPolygonColor)
const polygonColors = new WeakMap();

/**
 * Give a polygon its fill color. The polygon gets one material, the first time, that reads its color from here:
 * replacing the material at every time step makes Cesium rebuild the polygon, which leaves it undrawn for a moment
 * (the layer flashes while the timeline plays).
 */
export function setPolygonColor(entity, color) {
  const holder = polygonColors.get(entity);
  if (holder) {
    holder.color = color;
    return;
  }
  const created = { color };
  polygonColors.set(entity, created);
  entity.polygon.material = new ColorMaterialProperty(new CallbackProperty(() => created.color, false));
}

/** Color the features of a loaded value layer with their values of one row. Returns how many were colored. */
export function colorFeatures(dataSource, values, row, rampName, variable, polygonAlpha = POLYGON_ALPHA) {
  let colored = 0;
  values.ids.forEach((id, i) => {
    const entity = dataSource.entities.getById(id);
    if (!entity) return;
    const value = values.values[i]?.[row] ?? null;
    if (entity.point) {
      entity.point.color = featureColor(rampName, value, variable);
      colored += 1;
    } else if (entity.polygon) {
      setPolygonColor(entity, featureColor(rampName, value, variable, polygonAlpha));
      colored += 1;
    }
  });
  return colored;
}

/** Give every feature of a loaded value layer the no-value color. */
export function clearFeatureColors(dataSource, polygonAlpha = POLYGON_ALPHA) {
  dataSource.entities.values.forEach((entity) => {
    if (entity.point) {
      entity.point.color = featureColor(null, null, null);
    } else if (entity.polygon) {
      setPolygonColor(entity, featureColor(null, null, null, polygonAlpha));
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
  const { values, loading } = useLayerValuesState(variable ? TETHYS_MEDIA_URL + variable.values : null);
  const rampName = resolveRampName(dataset, colorRamps);

  // Basin output written with the surface of the mesh (viz.surface) is drawn on it: one color, as the basin has
  // one value, over the terrain of the mesh instead of a flat outline. The polygon stays loaded, all but
  // transparent: it is the feature that is selected and plotted.
  const surface = dataset.viz.surface ?? null;
  const surfaceUrl = surface?.url ?? null;
  const [originLongitude, originLatitude, originHeight] = surface?.origin ?? [];
  const surfaceShader = useMemo(
    () => (surfaceUrl ? makeSolidColorShader(featureColor(null, null, null)) : null),
    [surfaceUrl]
  );
  const surfaceMatrix = useMemo(
    () => (
      surfaceUrl && Number.isFinite(originLongitude) && Number.isFinite(originLatitude)
        ? Transforms.northUpEastToFixedFrame(Cartesian3.fromDegrees(originLongitude, originLatitude, originHeight ?? 0))
        : null
    ),
    [surfaceUrl, originLongitude, originLatitude, originHeight]
  );
  // The url of the surface whose model is on the map. Until it is (and if it cannot be loaded) the basin is the
  // flat polygon, as for a layer written without a surface.
  const [readySurfaceUrl, setReadySurfaceUrl] = useState(null);
  const surfaceReady = Boolean(surfaceUrl) && readySurfaceUrl === surfaceUrl;
  const polygonAlpha = surfaceReady ? HIDDEN_POLYGON_ALPHA : POLYGON_ALPHA;
  const basin = dataSource ? dataSource.entities.values.find((entity) => entity.polygon) ?? null : null;

  useEffect(() => {
    if (!dataSource) return;
    // While the values of a newly selected variable load, the features keep the colors they have: clearing them
    // for that moment makes the layer (and what lies under a basin polygon) flash
    if (loading) return;
    if (!values || !variable || values.variable !== variable.name) {
      // No values for the selected variable: never leave the colors of the previous one under its legend
      clearFeatureColors(dataSource, polygonAlpha);
      if (surfaceShader) setSolidColor(surfaceShader, featureColor(null, null, null));
      return;
    }
    const row = rowIndexForTime(values, meshClockTime);
    colorFeatures(dataSource, values, row, rampName, variable, polygonAlpha);
    if (surfaceShader && basin) {
      // the one value of the basin
      setSolidColor(surfaceShader, featureColor(rampName, featureValue(values, basin.id, row), variable));
    }
  }, [dataSource, values, loading, variable, rampName, meshClockTime, polygonAlpha, surfaceShader, basin]);

  const handleSurfaceError = (error) => {
    console.error(`Failed to load the mesh surface of dataset ${dataset.id}; the basin is drawn flat.`, error);
    setReadySurfaceUrl(null);
  };

  const url = dataset.viz.url?.[0];
  if (!url) return null;
  const shown = Boolean(visibleObjects?.[projectId]?.includes(dataset.id));
  return (
    <>
      <CzmlDataSource
        key={`czml-values-${dataset.id}-${url}`}
        data={TETHYS_MEDIA_URL + url}
        show={shown && Boolean(variable)}
        onLoad={setDataSource}
      />
      {surfaceUrl && surfaceMatrix && basin && (
        <Model
          key={`czml-surface-${dataset.id}-${surfaceUrl}`}
          url={TETHYS_MEDIA_URL + surfaceUrl}
          modelMatrix={surfaceMatrix}
          minimumPixelSize={10}
          customShader={surfaceShader}
          id={basin} // a click on the surface selects the basin: the model is picked as the polygon's entity
          show={shown && Boolean(variable)}
          onReady={() => setReadySurfaceUrl(surfaceUrl)}
          onError={handleSurfaceError}
        />
      )}
    </>
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
