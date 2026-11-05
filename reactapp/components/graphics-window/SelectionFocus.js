import { useContext, useEffect } from "react";
import { useCesium } from "resium";
import { BoundingSphere, BoundingSphereState, Cartesian2, Cartesian3, SceneTransforms } from "cesium";

import { GraphicsWindowVisualsContext, SidePanelContext } from "react-tethys/context";
import { PLOT_SHEET_HEIGHT_FRACTION, isPlotPanelId } from "constants/PlotConstants";

const REVEAL_MARGIN_PX = 24; // a feature this close to the sheet's top edge counts as covered
const SHIFT_DURATION_S = 0.6;

/**
 * Canvas-space y of the plot sheet's top edge: the sheet covers the bottom PLOT_SHEET_HEIGHT_FRACTION of the window,
 * and the canvas starts below the navbar.
 */
export function coveredFromY(canvas, windowHeight = window.innerHeight) {
  const top = canvas?.getBoundingClientRect?.().top ?? 0;
  return windowHeight * (1 - PLOT_SHEET_HEIGHT_FRACTION) - top;
}

/**
 * Moves the camera, keeping its orientation, so `entity` shows in the middle of the map strip above `coveredY`
 * (canvas px). Does nothing when the entity is already above the strip's edge, has no visualization yet, or the
 * target screen point has no ground under it (sky). Returns true when the camera was moved.
 */
export function shiftToReveal(viewer, entity, coveredY) {
  const { scene, camera, dataSourceDisplay } = viewer;
  const sphere = new BoundingSphere();
  if (dataSourceDisplay.getBoundingSphere(entity, true, sphere) !== BoundingSphereState.DONE) {
    return false;
  }
  const screen = SceneTransforms.wgs84ToWindowCoordinates(scene, sphere.center);
  if (!screen || screen.y < coveredY - REVEAL_MARGIN_PX) {
    return false;
  }
  const ray = camera.getPickRay(new Cartesian2(screen.x, coveredY / 2));
  const target = ray ? scene.globe.pick(ray, scene) : undefined;
  if (!target) {
    return false;
  }
  // Translating the camera by (entity - target) puts the entity where the target ground point is now.
  const delta = Cartesian3.subtract(sphere.center, target, new Cartesian3());
  const destination = Cartesian3.add(camera.position, delta, new Cartesian3());
  camera.flyTo({
    destination,
    orientation: { heading: camera.heading, pitch: camera.pitch, roll: camera.roll },
    duration: SHIFT_DURATION_S,
  });
  return true;
}

/**
 * Keeps the globe's selection in step with the app's: clears Cesium's selected entity when the app selection is
 * cleared (plot sheet closed, layer hidden), and when a plot sheet opens over the selected feature, shifts the
 * view so the feature stays visible above the sheet. Must be rendered inside a resium <Viewer>. Renders nothing.
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
    shiftToReveal(viewer, entity, coveredFromY(viewer.scene?.canvas));
  }, [viewer, plotOpen, selectedCZMLPoint]);

  return null;
};

export default SelectionFocus;
