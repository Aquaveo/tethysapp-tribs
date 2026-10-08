import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { datasetPropTypes } from "components/tree/propTypes";
import { Model } from "resium";
import { Cartesian3, Transforms } from "cesium";
import { GraphicsWindowVisualsContext, ProjectContext } from "react-tethys/context";
import extractLayerName from "lib/extractLayerName";
import { findVariable, getVariables, timestepForTime } from "lib/meshTimeSeries";

/**
 * The media-relative glTF url a dataset should show right now: the time step of the selected variable at the
 * current mesh clock time, or (datasets without viz.variables) the url matching the selected layer name.
 */
export function desiredGltfUrl(dataset, visibleCZMLObject, meshClockTime) {
  const variables = getVariables(dataset);
  if (variables) {
    const variable = findVariable(dataset, visibleCZMLObject?.[dataset.id]) ?? variables[0];
    return timestepForTime(variable, meshClockTime)?.url ?? null;
  }
  const urls = dataset?.viz?.url ?? [];
  if (urls.length > 1) {
    const index = urls.findIndex(
      (url) => extractLayerName(url, dataset.id) === visibleCZMLObject?.[dataset.id]
    );
    return urls[index >= 0 ? index : 0];
  }
  return urls[0] ?? null;
}

const OTHER_SLOT = { a: "b", b: "a" };

/**
 * Renders a glTF mesh dataset with two model "slots" so time steps swap without a blank frame: the visible slot
 * keeps showing the current model while the next url loads hidden in the other slot, then they swap once the
 * hidden model is ready.
 */
const GltfLayer = ({ dataset }) => {
  const TETHYS_MEDIA_URL = process.env.TETHYS_MEDIA_URL;
  const { visibleObjects, visibleCZMLObject, meshClockTime } = useContext(GraphicsWindowVisualsContext);
  const { projectId } = useContext(ProjectContext);
  const [slots, setSlots] = useState({ a: null, b: null, visible: "a" });

  const desiredUrl = desiredGltfUrl(dataset, visibleCZMLObject, meshClockTime);

  useEffect(() => {
    if (!desiredUrl) return;
    setSlots((prev) => {
      const hidden = OTHER_SLOT[prev.visible];
      if (prev[prev.visible] === desiredUrl) {
        // Already showing it; drop any load that is no longer wanted.
        return prev[hidden] === null ? prev : { ...prev, [hidden]: null };
      }
      if (prev[prev.visible] === null) {
        // Nothing on screen yet: load straight into the visible slot.
        return { ...prev, [prev.visible]: desiredUrl };
      }
      if (prev[hidden] === desiredUrl) return prev; // Already loading it.
      return { ...prev, [hidden]: desiredUrl }; // Load hidden; swap when ready.
    });
  }, [desiredUrl]);

  const handleHiddenReady = useCallback((slot) => {
    setSlots((prev) => {
      if (prev.visible === slot || prev[slot] === null) return prev;
      return { ...prev, [prev.visible]: null, visible: slot };
    });
  }, []);

  const handleHiddenError = useCallback((slot, error) => {
    console.error(`Failed to load mesh time step for dataset ${dataset.id}`, error);
    setSlots((prev) => (prev.visible === slot ? prev : { ...prev, [slot]: null }));
  }, [dataset.id]);

  const gltf_origin = dataset.viz?.origin;
  const enuMatrix = useMemo(
    () => (gltf_origin ? Transforms.northUpEastToFixedFrame(Cartesian3.fromDegrees(...gltf_origin)) : null),
    [gltf_origin]
  );
  if (!enuMatrix) return null; // TODO: add warning icon to dataset to indicate issue

  let show = false;
  if (visibleObjects?.[projectId] !== undefined) {
    show = visibleObjects[projectId].includes(dataset.id);
  }

  return (
    <>
      {["a", "b"].map((slot) => {
        const url = slots[slot];
        if (!url) return null;
        const isVisible = slots.visible === slot;
        return (
          <Model
            key={`graphics-model-${dataset.id}-${slot}-${url}`}
            url={TETHYS_MEDIA_URL + url}
            modelMatrix={enuMatrix}
            minimumPixelSize={10}
            show={isVisible && show}
            onReady={isVisible ? undefined : () => handleHiddenReady(slot)}
            onError={isVisible ? undefined : (error) => handleHiddenError(slot, error)}
          />
        );
      })}
    </>
  );
};

GltfLayer.propTypes = {
  dataset: datasetPropTypes.isRequired,
  datasetIndex: PropTypes.number,
};

export default GltfLayer;
