import { useContext, useEffect } from "react";
import { useCesium } from "resium";
import {
  BoundingSphere, BoundingSphereState, Cartesian2, Cartesian3, Cartographic, IntersectionTests, Math as CesiumMath,
  Matrix3, Plane, Quaternion, SceneMode, SceneTransforms, ScreenSpaceEventType,
} from "cesium";

import { GraphicsWindowVisualsContext, SidePanelContext } from "react-tethys/context";
import { PLOT_SHEET_HEIGHT_FRACTION, isPlotPanelId } from "constants/PlotConstants";

const REVEAL_MARGIN_PX = 24; // a feature this close to the sheet's top edge counts as covered
const SHIFT_DURATION_S = 0.6;
const MIN_CLEARANCE_M = 10; // the camera is never moved closer to the ground than this
const TILT_STEP = CesiumMath.toRadians(1);
const MAX_TILT = CesiumMath.toRadians(35); // a level view needs about 25 degrees; beyond this the view is left alone

/**
 * The part of the canvas the open plot sheet covers, in canvas px: {top, left, right}. Measured from the sheet's
 * layout box (`[data-plot-sheet]`, offsets rather than getBoundingClientRect so its slide-in transform does not
 * matter); when no sheet is laid out yet, assumed from the docking fraction and the full canvas width.
 */
export function coveredArea(canvas, windowHeight = window.innerHeight) {
  const canvasRect = canvas?.getBoundingClientRect?.() ?? { top: 0, left: 0 };
  const sheet = typeof document === "undefined" ? null : document.querySelector("[data-plot-sheet]");
  if (sheet && sheet.offsetWidth > 0) {
    return {
      top: sheet.offsetTop - canvasRect.top,
      left: sheet.offsetLeft - canvasRect.left,
      right: sheet.offsetLeft + sheet.offsetWidth - canvasRect.left,
    };
  }
  return { top: windowHeight * (1 - PLOT_SHEET_HEIGHT_FRACTION) - canvasRect.top, left: -Infinity, right: Infinity };
}

/**
 * Window coordinates of a world position. Cesium renamed SceneTransforms.wgs84ToWindowCoordinates to
 * worldToWindowCoordinates and later removed the old name; package.json allows versions on both sides of that, so
 * use whichever the installed one has.
 */
function toWindowCoordinates(scene, position) {
  const transform = SceneTransforms.worldToWindowCoordinates ?? SceneTransforms.wgs84ToWindowCoordinates;
  return transform(scene, position);
}

/**
 * True when a camera at `destination` would be under the ground or too close to it: less than `MIN_CLEARANCE_M`
 * above the height of the feature at `featurePosition`, or above the terrain under the destination. The terrain
 * height is the globe's best guess (from the tiles it has rendered, often coarse ones away from the view) and may
 * be unknown, so the feature's height is what the check can always rely on.
 */
function isBelowGround(scene, destination, featurePosition) {
  const cartographic = Cartographic.fromCartesian(destination);
  const feature = Cartographic.fromCartesian(featurePosition);
  if (!cartographic || !feature) {
    return true;
  }
  const terrainHeight = scene.globe?.getHeight?.(cartographic);
  const ground = Math.max(feature.height, terrainHeight ?? -Infinity);
  return cartographic.height < ground + MIN_CLEARANCE_M;
}

/**
 * The smallest tilt towards overhead, in whole steps from none up to `MAX_TILT` (and never past straight down),
 * with which a camera headed for `destination` stays clear of the ground, as {destination, tilt}; undefined when
 * there is none. Tilting swings the camera up around `center` (the feature) about the camera's right axis, which
 * keeps the feature at the same distance and, for a camera without roll and a move that is short next to the
 * size of the globe, at the same place on the screen.
 */
function clearOfGround(scene, camera, destination, center) {
  const offset = Cartesian3.subtract(destination, center, new Cartesian3());
  const maxTilt = Math.min(MAX_TILT, camera.pitch + CesiumMath.PI_OVER_TWO);
  const steps = Math.floor(maxTilt / TILT_STEP + CesiumMath.EPSILON9);
  for (let step = 0; step <= steps; step++) {
    const tilt = step * TILT_STEP;
    // A negative angle about the right axis turns the view direction down and so lifts the camera.
    const rotation = Matrix3.fromQuaternion(Quaternion.fromAxisAngle(camera.rightWC, -tilt));
    const swung = Matrix3.multiplyByVector(rotation, offset, new Cartesian3());
    const tilted = Cartesian3.add(center, swung, new Cartesian3());
    if (!isBelowGround(scene, tilted, center)) {
      return { destination: tilted, tilt };
    }
  }
  return undefined;
}

/**
 * Moves the camera, keeping its orientation and its distance to `entity`, so the entity shows in the middle of the
 * map strip above the covered `area`. The move is sideways and up or down as the camera sees it, never towards or
 * away from the entity, so the entity looks the same size afterwards however the view is tilted. In a view so
 * level that the move would take the camera under the ground, the view is first tilted towards overhead, by as
 * little as keeps the camera above it (the heading and the distance are still kept). Does nothing outside the 3D
 * scene mode (the camera frame differs in 2D and Columbus view), while an entity is tracked (the camera is in its
 * frame), when the entity is not under the sheet or has no visualization yet, or when no tilt of up to `MAX_TILT`
 * keeps the camera above the ground. Returns true when the camera was moved.
 */
export function shiftToReveal(viewer, entity, area) {
  const { scene, camera, dataSourceDisplay } = viewer;
  if (scene.mode !== SceneMode.SCENE3D || viewer.trackedEntity) {
    return false;
  }
  // getBoundingSphere is what Viewer.zoomTo uses but is marked @private in Cesium; it is the only way to place
  // polygon entities (points could use entity.position instead). Being private it may go away: without it the
  // view is simply not shifted.
  if (typeof dataSourceDisplay?.getBoundingSphere !== "function") {
    return false;
  }
  const sphere = new BoundingSphere();
  if (dataSourceDisplay.getBoundingSphere(entity, true, sphere) !== BoundingSphereState.DONE) {
    return false;
  }
  const screen = toWindowCoordinates(scene, sphere.center);
  if (!screen) {
    return false;
  }
  const covered = screen.y >= area.top - REVEAL_MARGIN_PX && screen.x >= area.left && screen.x <= area.right;
  if (!covered) {
    return false;
  }
  // The target is where the middle of the visible strip looks at the plane through the entity that faces the
  // camera. Picking the ground there instead would, in a tilted view, find a point far beyond the entity and back
  // the camera away from it.
  const ray = camera.getPickRay(new Cartesian2(screen.x, area.top / 2));
  const facingPlane = Plane.fromPointNormal(sphere.center, camera.directionWC);
  const target = ray ? IntersectionTests.rayPlane(ray, facingPlane) : undefined;
  if (!target) {
    return false;
  }
  // Translating the camera by (entity - target) puts the entity where the target point is now.
  const delta = Cartesian3.subtract(sphere.center, target, new Cartesian3());
  const destination = Cartesian3.add(camera.positionWC, delta, new Cartesian3());
  const clear = clearOfGround(scene, camera, destination, sphere.center);
  if (!clear) {
    return false;
  }
  camera.flyTo({
    destination: clear.destination,
    orientation: { heading: camera.heading, pitch: camera.pitch - clear.tilt, roll: camera.roll },
    duration: SHIFT_DURATION_S,
  });
  return true;
}

/**
 * Keeps the globe's selection in step with the app's: when the app selection is cleared (the plot sheet was
 * closed) it clears Cesium's selected entity and ends any camera tracking, and when a plot sheet opens over the
 * selected feature it shifts the view so the feature stays visible above the sheet. Also turns off Cesium's
 * double-click action (track a point, or zoom to a polygon), which would replace the user's view with Cesium's
 * default one. Must be rendered inside a resium <Viewer>. Renders nothing.
 */
const SelectionFocus = () => {
  const { viewer } = useCesium();
  const { selectedCZMLPoint } = useContext(GraphicsWindowVisualsContext);
  const { visibleSidePanel } = useContext(SidePanelContext);
  const plotOpen = (visibleSidePanel ?? []).some(isPlotPanelId);

  useEffect(() => {
    viewer?.cesiumWidget?.screenSpaceEventHandler?.removeInputAction(ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  }, [viewer]);

  useEffect(() => {
    if (!viewer || selectedCZMLPoint) return;
    if (viewer.selectedEntity !== undefined) {
      viewer.selectedEntity = undefined;
    }
    // The info box's camera button can still track the selected feature. Double-clicking the empty globe used to
    // end that; now clearing the selection does, so the camera is never left locked to a feature.
    if (viewer.trackedEntity !== undefined) {
      viewer.trackedEntity = undefined;
    }
  }, [viewer, selectedCZMLPoint]);

  useEffect(() => {
    if (!viewer || !plotOpen || !selectedCZMLPoint) return;
    const entity = viewer.selectedEntity;
    if (!entity || entity.id !== selectedCZMLPoint) return;
    shiftToReveal(viewer, entity, coveredArea(viewer.scene?.canvas));
  }, [viewer, plotOpen, selectedCZMLPoint]);

  return null;
};

export default SelectionFocus;
