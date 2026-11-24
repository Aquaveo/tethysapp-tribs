import { render } from "@testing-library/react";
import {
  BoundingSphereState, Cartesian2, Cartesian3, Math as CesiumMath, Matrix4, Ray, SceneMode, SceneTransforms,
  ScreenSpaceEventType, Transforms,
} from "cesium";
import { useCesium } from "resium";

import { GraphicsWindowVisualsContext, SidePanelContext } from "react-tethys/context";
import SelectionFocus, { coveredArea, frameFromOverhead, revealAboveSheet, shiftToReveal } from "./SelectionFocus";

jest.mock("resium", () => ({ useCesium: jest.fn() }));

const ENTITY_POS = Cartesian3.fromDegrees(-111.0, 33.0, 500.0);
const ENU = Transforms.eastNorthUpToFixedFrame(ENTITY_POS);
const STRAIGHT_DOWN = -CesiumMath.PI_OVER_TWO;
const TILTED = -CesiumMath.toRadians(45);
const AREA = { top: 400, left: 320, right: 1180 }; // the sheet, in canvas px

// World position / direction of a point / vector given in metres east, north and up of the entity.
const local = (east, north, up) => Matrix4.multiplyByPoint(ENU, new Cartesian3(east, north, up), new Cartesian3());
const localDirection = (east, north, up) =>
  Cartesian3.normalize(
    Matrix4.multiplyByPointAsVector(ENU, new Cartesian3(east, north, up), new Cartesian3()),
    new Cartesian3()
  );
const rayFrom = (origin, through) =>
  new Ray(origin, Cartesian3.normalize(Cartesian3.subtract(through, origin, new Cartesian3()), new Cartesian3()));

// Looking straight down from 10 km above the entity; the pick ray of the target screen point passes through
// TOP_DOWN_TARGET, a point level with the entity.
const TOP_DOWN_POSITION = local(0, 0, 10000);
const TOP_DOWN_TARGET = local(100, 50, 0);

// A fake viewer: `screen` is where SceneTransforms will say the entity is; `ray` the pick ray of the target
// screen point; `terrainHeight` what the globe says the ground height is under the camera's destination.
function makeViewer({
  entity = { id: "point_7 [ds]" },
  screen = new Cartesian2(600, 700),
  sphereState = BoundingSphereState.DONE,
  mode = SceneMode.SCENE3D,
  trackedEntity = undefined,
  position = TOP_DOWN_POSITION,
  direction = localDirection(0, 0, -1),
  ray = rayFrom(TOP_DOWN_POSITION, TOP_DOWN_TARGET),
  terrainHeight = undefined,
  pitch = STRAIGHT_DOWN,
  heading = 0.1,
  radius = 1,
} = {}) {
  const canvas = { getBoundingClientRect: () => ({ top: 50, left: 0 }), clientWidth: 1500, clientHeight: 850 };
  return {
    selectedEntity: entity,
    trackedEntity,
    scene: { canvas, mode, globe: { getHeight: jest.fn(() => terrainHeight) }, __screen: screen },
    camera: {
      positionWC: position,
      directionWC: direction,
      heading, pitch, roll: 0,
      frustum: { fovy: CesiumMath.toRadians(60) },
      getPickRay: jest.fn(() => ray),
      flyTo: jest.fn(),
    },
    cesiumWidget: { screenSpaceEventHandler: { removeInputAction: jest.fn() } },
    dataSourceDisplay: {
      getBoundingSphere: jest.fn((e, allowPartial, result) => {
        Cartesian3.clone(ENTITY_POS, result.center);
        result.radius = radius;
        return sphereState;
      }),
    },
  };
}

const flownTo = (viewer) => viewer.camera.flyTo.mock.calls[0][0];

let toWindow;
beforeEach(() => {
  toWindow = jest.spyOn(SceneTransforms, "wgs84ToWindowCoordinates").mockImplementation((scene) => scene.__screen);
  window.innerHeight = 900;
});
afterEach(() => toWindow.mockRestore());

const tree = (selectedCZMLPoint, visibleSidePanel) => (
  <GraphicsWindowVisualsContext.Provider value={{ selectedCZMLPoint }}>
    <SidePanelContext.Provider value={{ visibleSidePanel }}>
      <SelectionFocus />
    </SidePanelContext.Provider>
  </GraphicsWindowVisualsContext.Provider>
);

function renderFocus(viewer, selectedCZMLPoint = null, visibleSidePanel = []) {
  useCesium.mockReturnValue({ viewer });
  return render(tree(selectedCZMLPoint, visibleSidePanel));
}

describe("coveredArea", () => {
  const canvas = { getBoundingClientRect: () => ({ top: 50, left: 0 }) };

  it("assumes the docked sheet's top edge and the full width when no sheet is laid out", () => {
    expect(coveredArea(canvas, 900)).toEqual({ top: 400, left: -Infinity, right: Infinity });
    expect(coveredArea(undefined, 900).top).toBe(450);
  });

  it("measures the open sheet's layout box in canvas coordinates", () => {
    const sheet = document.createElement("div");
    sheet.setAttribute("data-plot-sheet", "");
    Object.defineProperties(sheet, { offsetTop: { value: 450 }, offsetLeft: { value: 370 }, offsetWidth: { value: 860 } });
    document.body.appendChild(sheet);
    try {
      expect(coveredArea(canvas, 900)).toEqual({ top: 400, left: 370, right: 1230 });
    } finally {
      sheet.remove();
    }
  });
});

describe("shiftToReveal", () => {
  it("moves the camera by the entity-to-target offset, keeping its orientation", () => {
    const viewer = makeViewer();
    expect(shiftToReveal(viewer, viewer.selectedEntity, AREA)).toBe(true);
    expect(viewer.camera.getPickRay).toHaveBeenCalledWith(new Cartesian2(600, 200)); // middle of the visible strip
    const { destination, orientation, duration } = flownTo(viewer);
    // position + (entity - target): looking straight down this is a level pan
    expect(Cartesian3.distance(destination, local(-100, -50, 10000))).toBeLessThan(0.01);
    expect(orientation).toEqual({ heading: 0.1, pitch: STRAIGHT_DOWN, roll: 0 });
    expect(duration).toBeGreaterThan(0);
  });

  it("keeps its distance to the feature when the view is tilted", () => {
    // 45 degrees down towards the entity from the south; the target screen point's ray meets the ground 3 km
    // north of the entity, far beyond it.
    const position = local(0, -5000, 5000);
    const direction = localDirection(0, 1, -1);
    const viewer = makeViewer({ position, direction, ray: rayFrom(position, local(0, 3000, 0)) });
    expect(shiftToReveal(viewer, viewer.selectedEntity, AREA)).toBe(true);
    const { destination, orientation } = flownTo(viewer);
    const move = Cartesian3.subtract(destination, position, new Cartesian3());
    expect(Cartesian3.magnitude(move)).toBeGreaterThan(100); // it does move
    expect(Math.abs(Cartesian3.dot(move, direction))).toBeLessThan(0.01); // but not towards or away from the feature
    expect(orientation).toEqual({ heading: 0.1, pitch: STRAIGHT_DOWN, roll: 0 });
  });

  it("leaves the camera alone when the move would take it to the feature's level or below", () => {
    // Nearly level with the entity: the target screen point shows sky, and bringing the entity up to it would
    // lower the camera by more than its height.
    const position = local(0, -5000, 300);
    const viewer = makeViewer({
      position,
      direction: localDirection(0, 5000, -300),
      ray: rayFrom(position, local(0, 5000, 600)),
    });
    expect(shiftToReveal(viewer, viewer.selectedEntity, AREA)).toBe(false);
    expect(viewer.camera.flyTo).not.toHaveBeenCalled();
  });

  it("leaves the camera alone when the move would take it below the terrain at its destination", () => {
    const viewer = makeViewer({ terrainHeight: 20000 }); // the globe says the ground there is above the camera
    expect(shiftToReveal(viewer, viewer.selectedEntity, AREA)).toBe(false);
    expect(viewer.camera.flyTo).not.toHaveBeenCalled();
  });

  it("uses worldToWindowCoordinates when the installed Cesium has it (the name newer releases use)", () => {
    const viewer = makeViewer();
    SceneTransforms.worldToWindowCoordinates = jest.fn((scene) => scene.__screen);
    try {
      expect(shiftToReveal(viewer, viewer.selectedEntity, AREA)).toBe(true);
      expect(SceneTransforms.worldToWindowCoordinates).toHaveBeenCalledTimes(1);
      expect(toWindow).not.toHaveBeenCalled();
    } finally {
      delete SceneTransforms.worldToWindowCoordinates;
    }
  });

  it("leaves the camera alone when Cesium no longer offers a bounding sphere for entities", () => {
    const viewer = makeViewer();
    delete viewer.dataSourceDisplay.getBoundingSphere; // a private Cesium API
    expect(shiftToReveal(viewer, viewer.selectedEntity, AREA)).toBe(false);
    expect(viewer.camera.flyTo).not.toHaveBeenCalled();
  });

  it("leaves the camera alone when the entity is not under the sheet", () => {
    const above = makeViewer({ screen: new Cartesian2(600, 300) });
    expect(shiftToReveal(above, above.selectedEntity, AREA)).toBe(false);
    const beside = makeViewer({ screen: new Cartesian2(100, 700) }); // under the project tree, not the sheet
    expect(shiftToReveal(beside, beside.selectedEntity, AREA)).toBe(false);
    const behind = makeViewer({ screen: null }); // behind the camera (SceneTransforms gives nothing)
    expect(shiftToReveal(behind, behind.selectedEntity, AREA)).toBe(false);
    expect(above.camera.flyTo).not.toHaveBeenCalled();
  });

  it("treats a feature just above the edge as covered", () => {
    const viewer = makeViewer({ screen: new Cartesian2(600, 390) });
    expect(shiftToReveal(viewer, viewer.selectedEntity, AREA)).toBe(true);
  });

  it("does nothing without a bounding sphere, a pick ray, or a ray that reaches the entity's distance", () => {
    for (const viewer of [
      makeViewer({ sphereState: BoundingSphereState.PENDING }),
      makeViewer({ sphereState: BoundingSphereState.FAILED }),
      makeViewer({ ray: null }),
      makeViewer({ ray: new Ray(TOP_DOWN_POSITION, localDirection(1, 0, 0)) }), // level: never gets down to it
    ]) {
      expect(shiftToReveal(viewer, viewer.selectedEntity, AREA)).toBe(false);
      expect(viewer.camera.flyTo).not.toHaveBeenCalled();
    }
  });

  it("does nothing outside the 3D scene mode or while an entity is tracked", () => {
    for (const viewer of [
      makeViewer({ mode: SceneMode.COLUMBUS_VIEW }),
      makeViewer({ mode: SceneMode.SCENE2D }),
      makeViewer({ mode: SceneMode.MORPHING }),
      makeViewer({ trackedEntity: { id: "point_7 [ds]" } }),
    ]) {
      expect(shiftToReveal(viewer, viewer.selectedEntity, AREA)).toBe(false);
      expect(viewer.dataSourceDisplay.getBoundingSphere).not.toHaveBeenCalled();
    }
  });
});

describe("frameFromOverhead", () => {
  // 45 degrees down towards the entity from the south, 7071 m away. From that far overhead a canvas pixel covers
  // 2 * 7071 * tan(30 deg) / 850 = 9.606 m, and the middle of the strip (y = 200) is 225 px above the view centre.
  const position = local(0, -5000, 5000);
  const tilted = (options) => makeViewer({ position, pitch: TILTED, direction: localDirection(0, 1, -1), ...options });
  const PX = (2 * Math.hypot(5000, 5000) * Math.tan(CesiumMath.toRadians(30))) / 850;

  it("looks straight down from the same distance and heading, with the feature in the middle of the strip", () => {
    const viewer = tilted({ heading: 0 });
    expect(frameFromOverhead(viewer, viewer.selectedEntity, AREA)).toBe(true);
    const { destination, orientation, duration } = flownTo(viewer);
    // North is up: the camera sits south of the feature, which then shows above the view centre. The sheet's
    // middle (x = 750) is the canvas middle, so there is no sideways offset.
    expect(Cartesian3.distance(destination, local(0, -225 * PX, Math.hypot(5000, 5000)))).toBeLessThan(0.01);
    expect(orientation).toEqual({ heading: 0, pitch: STRAIGHT_DOWN, roll: 0 });
    expect(duration).toBeGreaterThan(0);
  });

  it("offsets the camera along the view's own up and right when the heading is not north", () => {
    const viewer = tilted({ heading: CesiumMath.PI_OVER_TWO }); // east is up, south is right
    const area = { top: 400, left: 520, right: 1180 }; // sheet middle at x = 850, 100 px right of the canvas middle
    expect(frameFromOverhead(viewer, viewer.selectedEntity, area)).toBe(true);
    const { destination, orientation } = flownTo(viewer);
    // Feature above the centre: camera to the west. Feature right of the centre: camera to the north.
    expect(Cartesian3.distance(destination, local(-225 * PX, 100 * PX, Math.hypot(5000, 5000)))).toBeLessThan(0.01);
    expect(orientation.heading).toBe(CesiumMath.PI_OVER_TWO);
  });

  it("centres the feature across the canvas when the sheet's sides are not known", () => {
    const viewer = tilted({ heading: 0 });
    frameFromOverhead(viewer, viewer.selectedEntity, { top: 400, left: -Infinity, right: Infinity });
    expect(Cartesian3.distance(flownTo(viewer).destination, local(0, -225 * PX, Math.hypot(5000, 5000))))
      .toBeLessThan(0.01);
  });

  it("backs away just enough for a large feature to fit in the strip", () => {
    const viewer = tilted({ heading: 0, radius: 5000 });
    frameFromOverhead(viewer, viewer.selectedEntity, AREA);
    // 10 km across in 80 % of the 400 px strip: 31.25 m per pixel
    const range = (31.25 * 850) / (2 * Math.tan(CesiumMath.toRadians(30)));
    expect(Cartesian3.distance(flownTo(viewer).destination, local(0, -225 * 31.25, range))).toBeLessThan(0.01);
  });

  it("does nothing when the view cannot be moved for the feature or the camera has no field of view", () => {
    const orthographic = tilted();
    orthographic.camera.frustum = {};
    for (const viewer of [
      tilted({ mode: SceneMode.SCENE2D }),
      tilted({ trackedEntity: { id: "point_7 [ds]" } }),
      tilted({ sphereState: BoundingSphereState.PENDING }),
      orthographic,
    ]) {
      expect(frameFromOverhead(viewer, viewer.selectedEntity, AREA)).toBe(false);
      expect(viewer.camera.flyTo).not.toHaveBeenCalled();
    }
  });
});

describe("revealAboveSheet", () => {
  it("replaces a tilted view by one from overhead, even when the feature is not under the sheet", () => {
    const viewer = makeViewer({ pitch: TILTED, screen: new Cartesian2(600, 100) });
    expect(revealAboveSheet(viewer, viewer.selectedEntity, AREA)).toBe(true);
    expect(flownTo(viewer).orientation.pitch).toBe(STRAIGHT_DOWN);
  });

  it("only pans a view that is overhead already, and only when the feature is under the sheet", () => {
    const steep = -CesiumMath.toRadians(87);
    const covered = makeViewer({ pitch: steep });
    expect(revealAboveSheet(covered, covered.selectedEntity, AREA)).toBe(true);
    expect(flownTo(covered).orientation.pitch).toBe(steep); // kept as it was
    const visible = makeViewer({ pitch: steep, screen: new Cartesian2(600, 100) });
    expect(revealAboveSheet(visible, visible.selectedEntity, AREA)).toBe(false);
  });
});

describe("SelectionFocus", () => {
  it("turns off Cesium's double-click action, which would track or zoom to the feature and reset the view", () => {
    const viewer = makeViewer();
    const { rerender } = renderFocus(viewer);
    rerender(tree("point_7 [ds]", []));
    const { removeInputAction } = viewer.cesiumWidget.screenSpaceEventHandler;
    expect(removeInputAction).toHaveBeenCalledTimes(1);
    expect(removeInputAction).toHaveBeenCalledWith(ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  });

  it("clears the globe's selection when the app selection is cleared", () => {
    const viewer = makeViewer();
    const { rerender } = renderFocus(viewer, "point_7 [ds]", []);
    expect(viewer.selectedEntity).toBeDefined();
    rerender(tree(null, []));
    expect(viewer.selectedEntity).toBeUndefined();
  });

  it("stops tracking a feature when the app selection is cleared", () => {
    const tracked = { id: "point_7 [ds]" };
    const viewer = makeViewer({ entity: tracked, trackedEntity: tracked }); // the info box's camera button
    const { rerender } = renderFocus(viewer, "point_7 [ds]", []);
    expect(viewer.trackedEntity).toBe(tracked);
    rerender(tree(null, []));
    expect(viewer.trackedEntity).toBeUndefined();
  });

  it("shifts the view once when a plot sheet opens over the selected feature", () => {
    const viewer = makeViewer();
    const { rerender } = renderFocus(viewer, "point_7 [ds]", ["slide-panel-ds"]);
    expect(viewer.camera.flyTo).not.toHaveBeenCalled();
    rerender(tree("point_7 [ds]", ["slide-panel-ds", "plotly-panel-ds"]));
    expect(viewer.camera.flyTo).toHaveBeenCalledTimes(1);
    rerender(tree("point_7 [ds]", ["plotly-panel-ds"])); // another panel closing is not a reason to shift again
    expect(viewer.camera.flyTo).toHaveBeenCalledTimes(1);
  });

  it("ignores a plot sheet when the globe's selection is not the app's", () => {
    const viewer = makeViewer({ entity: { id: "point_1 [other]" } });
    renderFocus(viewer, "point_7 [ds]", ["plotly-panel-ds"]);
    expect(viewer.camera.flyTo).not.toHaveBeenCalled();
  });
});
