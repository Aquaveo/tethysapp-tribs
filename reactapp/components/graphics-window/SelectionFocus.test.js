import { render } from "@testing-library/react";
import { BoundingSphereState, Cartesian2, Cartesian3, SceneMode, SceneTransforms } from "cesium";
import { useCesium } from "resium";

import { GraphicsWindowVisualsContext, SidePanelContext } from "react-tethys/context";
import SelectionFocus, { coveredArea, shiftToReveal } from "./SelectionFocus";

jest.mock("resium", () => ({ useCesium: jest.fn() }));

const ENTITY_POS = new Cartesian3(1000, 2000, 3000);
const TARGET_GROUND = new Cartesian3(1100, 2050, 3000);
const AREA = { top: 400, left: 320, right: 1180 }; // the sheet, in canvas px

// A fake viewer: `screen` is where SceneTransforms will say the entity is; `ground` what globe.pick finds.
function makeViewer({
  entity = { id: "point_7 [ds]" },
  screen = new Cartesian2(600, 700),
  sphereState = BoundingSphereState.DONE,
  ground = TARGET_GROUND,
  mode = SceneMode.SCENE3D,
  trackedEntity = undefined,
  ray = {},
} = {}) {
  const canvas = { getBoundingClientRect: () => ({ top: 50, left: 0 }) };
  return {
    selectedEntity: entity,
    trackedEntity,
    scene: { canvas, mode, globe: { pick: jest.fn(() => ground) }, __screen: screen },
    camera: {
      positionWC: new Cartesian3(0, 0, 10000),
      heading: 0.1, pitch: -1.2, roll: 0,
      getPickRay: jest.fn(() => ray),
      flyTo: jest.fn(),
    },
    dataSourceDisplay: {
      getBoundingSphere: jest.fn((e, allowPartial, result) => {
        Cartesian3.clone(ENTITY_POS, result.center);
        result.radius = 1;
        return sphereState;
      }),
    },
  };
}

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
    const { destination, orientation, duration } = viewer.camera.flyTo.mock.calls[0][0];
    expect(destination).toEqual(new Cartesian3(-100, -50, 10000)); // position + (entity - ground target)
    expect(orientation).toEqual({ heading: 0.1, pitch: -1.2, roll: 0 });
    expect(duration).toBeGreaterThan(0);
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

  it("does nothing without a bounding sphere, a pick ray or ground under the target", () => {
    for (const viewer of [
      makeViewer({ sphereState: BoundingSphereState.PENDING }),
      makeViewer({ sphereState: BoundingSphereState.FAILED }),
      makeViewer({ ray: null }),
      makeViewer({ ground: null }),
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

describe("SelectionFocus", () => {
  it("clears the globe's selection when the app selection is cleared", () => {
    const viewer = makeViewer();
    const { rerender } = renderFocus(viewer, "point_7 [ds]", []);
    expect(viewer.selectedEntity).toBeDefined();
    rerender(tree(null, []));
    expect(viewer.selectedEntity).toBeUndefined();
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
