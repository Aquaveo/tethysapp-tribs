import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { datasetPropTypes } from "components/tree/propTypes";
import { Model } from "resium";
import { Cartesian3, CustomShader, LightingModel, Transforms } from "cesium";
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

let hillshadeShader = null;

/**
 * Shader shared by every mesh model. Cesium's own lighting is switched off (UNLIT) because it follows the sun, so the
 * mesh brightens and darkens as the clock animates. Instead the surface is shaded by a light fixed relative to the
 * viewer (above and to the left of the camera), which keeps the relief visible and stable while the clock runs.
 * Built on first use so the cesium module is only touched at run time.
 */
export function getHillshadeShader() {
  if (!hillshadeShader) {
    hillshadeShader = new CustomShader({
      lightingModel: LightingModel.UNLIT,
      fragmentShaderText: `
        const vec3 LIGHT_DIRECTION_EC = normalize(vec3(-0.4, 0.6, 1.0)); // eye coordinates: x right, y up, z toward the viewer
        const float AMBIENT = 0.35;

        void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
          vec3 normal = normalize(fsInput.attributes.normalEC);
          float diffuse = max(dot(normal, LIGHT_DIRECTION_EC), 0.0);
          material.diffuse *= AMBIENT + (1.0 - AMBIENT) * diffuse;
        }
      `,
    });
  }
  return hillshadeShader;
}

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
  const customShader = getHillshadeShader();

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
            customShader={customShader}
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
