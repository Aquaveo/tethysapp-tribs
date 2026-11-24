import { useContext, useEffect } from "react";
import { useCesium } from "resium";
import {
  BoundingSphere, BoundingSphereState, Cartesian2, Cartesian3, Cartographic, IntersectionTests, Math as CesiumMath,
  Matrix4, Plane, SceneMode, SceneTransforms, ScreenSpaceEventType, Transforms,
} from "cesium";

import { GraphicsWindowVisualsContext, SidePanelContext } from "react-tethys/context";
import { PLOT_SHEET_HEIGHT_FRACTION, isPlotPanelId } from "constants/PlotConstants";

const REVEAL_MARGIN_PX = 24; // a feature this close to the sheet's top edge counts as covered
const SHIFT_DURATION_S = 0.6;
const MIN_CLEARANCE_M = 10; // the camera is never moved closer to the ground than this
const OVERHEAD_PITCH = -CesiumMath.toRadians(85); // a view at least this steep counts as overhead already
const FRAME_FILL = 0.8; // a framed feature takes up at most this much of the strip above the sheet

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
 * The bounding sphere of `entity` when the view can be moved for it: undefined outside the 3D scene mode (the
 * camera frame differs in 2D and Columbus view), while an entity is tracked (the camera is in its frame), or when
 * the entity has no visualization yet.
 */
function movableSphere(viewer, entity) {
  const { scene, dataSourceDisplay } = viewer;
  if (scene.mode !== SceneMode.SCENE3D || viewer.trackedEntity) {
    return undefined;
  }
  // getBoundingSphere is what Viewer.zoomTo uses but is marked @private in Cesium; it is the only way to place
  // polygon entities (points could use entity.position instead). Being private it may go away: without it the
  // view is simply not moved.
  if (typeof dataSourceDisplay?.getBoundingSphere !== "function") {
    return undefined;
  }
  const sphere = new BoundingSphere();
  if (dataSourceDisplay.getBoundingSphere(entity, true, sphere) !== BoundingSphereState.DONE) {
    return undefined;
  }
  return sphere;
}

/**
 * Moves the camera, keeping its orientation and its distance to `entity`, so the entity shows in the middle of the
 * map strip above the covered `area`. The move is sideways and up or down as the camera sees it, never towards or
 * away from the entity. Meant for a view from overhead, where that is a pan over the ground. Does nothing when the
 * view cannot be moved for the entity (see `movableSphere`), when the entity is not under the sheet, or when the
 * move would take the camera under the ground. Returns true when the camera was moved.
 */
export function shiftToReveal(viewer, entity, area) {
  const { scene, camera } = viewer;
  const sphere = movableSphere(viewer, entity);
  if (!sphere) {
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
  // camera.
  const ray = camera.getPickRay(new Cartesian2(screen.x, area.top / 2));
  const facingPlane = Plane.fromPointNormal(sphere.center, camera.directionWC);
  const target = ray ? IntersectionTests.rayPlane(ray, facingPlane) : undefined;
  if (!target) {
    return false;
  }
  // Translating the camera by (entity - target) puts the entity where the target point is now.
  const delta = Cartesian3.subtract(sphere.center, target, new Cartesian3());
  const destination = Cartesian3.add(camera.positionWC, delta, new Cartesian3());
  if (isBelowGround(scene, destination, sphere.center)) {
    return false;
  }
  camera.flyTo({
    destination,
    orientation: { heading: camera.heading, pitch: camera.pitch, roll: camera.roll },
    duration: SHIFT_DURATION_S,
  });
  return true;
}

/**
 * Flies the camera to look straight down on `entity`, keeping the heading, with the entity in the middle of the
 * map strip above the covered `area`. The camera stays as far from the entity as it is now, or backs away just
 * enough for the whole entity to fit in the strip. Does nothing when the view cannot be moved for the entity (see
 * `movableSphere`) or the camera is not a perspective one. Returns true when the camera was moved.
 */
export function frameFromOverhead(viewer, entity, area) {
  const { scene, camera } = viewer;
  const sphere = movableSphere(viewer, entity);
  const width = scene.canvas?.clientWidth;
  const height = scene.canvas?.clientHeight;
  const halfFov = camera.frustum?.fovy / 2;
  if (!sphere || !width || !height || !(halfFov > 0)) {
    return false;
  }
  // From `range` above the entity, one canvas pixel covers 2 * range * tan(fovy / 2) / height metres of ground.
  const stripPx = Math.min(area.top, width);
  const fitRange = (sphere.radius * height) / (FRAME_FILL * stripPx * Math.tan(halfFov));
  const range = Math.max(Cartesian3.distance(camera.positionWC, sphere.center), fitRange);
  const metresPerPx = (2 * range * Math.tan(halfFov)) / height;
  // Where the entity should show: the middle of the strip, above the middle of the sheet when its sides are known.
  const targetX = Number.isFinite(area.left + area.right) ? (area.left + area.right) / 2 : width / 2;
  const right = (targetX - width / 2) * metresPerPx; // metres the entity sits right of the view centre
  const down = (area.top / 2 - height / 2) * metresPerPx; // and below it (negative: above)
  // Looking down with heading h, the view's right is (cos h, -sin h) and its up is (sin h, cos h) in east, north.
  const sin = Math.sin(camera.heading);
  const cos = Math.cos(camera.heading);
  const offset = new Cartesian3(-right * cos + down * sin, right * sin + down * cos, range);
  const destination = Matrix4.multiplyByPoint(
    Transforms.eastNorthUpToFixedFrame(sphere.center), offset, new Cartesian3()
  );
  camera.flyTo({
    destination,
    orientation: { heading: camera.heading, pitch: -CesiumMath.PI_OVER_TWO, roll: 0 },
    duration: SHIFT_DURATION_S,
  });
  return true;
}

/**
 * Makes `entity` visible above the plot sheet covering `area`: a view from overhead is panned if the entity is
 * under the sheet; a tilted view is replaced by one from overhead that frames the entity above the sheet (moving a
 * tilted camera sideways lowers it, into the ground in a level view). Returns true when the camera was moved.
 */
export function revealAboveSheet(viewer, entity, area) {
  const overhead = viewer.camera.pitch <= OVERHEAD_PITCH;
  return overhead ? shiftToReveal(viewer, entity, area) : frameFromOverhead(viewer, entity, area);
}

/**
 * Keeps the globe's selection in step with the app's: when the app selection is cleared (the plot sheet was
 * closed) it clears Cesium's selected entity and ends any camera tracking, and when a plot sheet opens for the
 * selected feature it moves the view so the feature shows above the sheet (see `revealAboveSheet`). Also turns off Cesium's
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
    revealAboveSheet(viewer, entity, coveredArea(viewer.scene?.canvas));
  }, [viewer, plotOpen, selectedCZMLPoint]);

  return null;
};

export default SelectionFocus;
