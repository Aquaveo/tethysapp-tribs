import { useContext, useEffect } from "react";
import { useCesium } from "resium";
import { BoundingSphere, BoundingSphereState, Cartesian2, Cartesian3, SceneMode, SceneTransforms } from "cesium";

import { GraphicsWindowVisualsContext, SidePanelContext } from "react-tethys/context";
import { PLOT_SHEET_HEIGHT_FRACTION, isPlotPanelId } from "constants/PlotConstants";

const REVEAL_MARGIN_PX = 24; // a feature this close to the sheet's top edge counts as covered
const SHIFT_DURATION_S = 0.6;

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
 * Moves the camera, keeping its orientation, so `entity` shows in the middle of the map strip above the covered
 * `area`. Does nothing outside the 3D scene mode (the camera frame differs in 2D and Columbus view), while an
 * entity is tracked (the camera is in its frame), when the entity is not under the sheet, has no visualization
 * yet, or when the target screen point has no ground under it. Returns true when the camera was moved.
 */
export function shiftToReveal(viewer, entity, area) {
  const { scene, camera, dataSourceDisplay } = viewer;
  if (scene.mode !== SceneMode.SCENE3D || viewer.trackedEntity) {
    return false;
  }
  // getBoundingSphere is what Viewer.zoomTo uses but is marked @private in Cesium; it is the only way to place
  // polygon entities (points could use entity.position instead).
  const sphere = new BoundingSphere();
  if (dataSourceDisplay.getBoundingSphere(entity, true, sphere) !== BoundingSphereState.DONE) {
    return false;
  }
  const screen = SceneTransforms.wgs84ToWindowCoordinates(scene, sphere.center);
  if (!screen) {
    return false;
  }
  const covered = screen.y >= area.top - REVEAL_MARGIN_PX && screen.x >= area.left && screen.x <= area.right;
  if (!covered) {
    return false;
  }
  const ray = camera.getPickRay(new Cartesian2(screen.x, area.top / 2));
  const target = ray ? scene.globe.pick(ray, scene) : undefined;
  if (!target) {
    return false;
  }
  // Translating the camera by (entity - target) puts the entity where the target ground point is now.
  const delta = Cartesian3.subtract(sphere.center, target, new Cartesian3());
  const destination = Cartesian3.add(camera.positionWC, delta, new Cartesian3());
  camera.flyTo({
    destination,
    orientation: { heading: camera.heading, pitch: camera.pitch, roll: camera.roll },
    duration: SHIFT_DURATION_S,
  });
  return true;
}

/**
 * Keeps the globe's selection in step with the app's: clears Cesium's selected entity when the app selection is
 * cleared (the plot sheet was closed), and when a plot sheet opens over the selected feature, shifts the view so
 * the feature stays visible above the sheet. Must be rendered inside a resium <Viewer>. Renders nothing.
 */
const SelectionFocus = () => {
  const { viewer } = useCesium();
  const { selectedCZMLPoint } = useContext(GraphicsWindowVisualsContext);
  const { visibleSidePanel } = useContext(SidePanelContext);
  const plotOpen = (visibleSidePanel ?? []).some(isPlotPanelId);

  useEffect(() => {
    if (!viewer || selectedCZMLPoint) return;
    if (viewer.selectedEntity !== undefined) {
      viewer.selectedEntity = undefined;
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
