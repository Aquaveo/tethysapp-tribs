import { render } from "@testing-library/react";
import { BoundingSphereState, Cartesian2, Cartesian3, SceneTransforms } from "cesium";
import { useCesium } from "resium";

import { GraphicsWindowVisualsContext, SidePanelContext } from "react-tethys/context";
import SelectionFocus, { coveredFromY, shiftToReveal } from "./SelectionFocus";

jest.mock("resium", () => ({ useCesium: jest.fn() }));

const ENTITY_POS = new Cartesian3(1000, 2000, 3000);
const TARGET_GROUND = new Cartesian3(1100, 2050, 3000);

function makeViewer({ entity = { id: "point_7 [ds]" }, screen = new Cartesian2(300, 700), sphereState = BoundingSphereState.DONE, ground = TARGET_GROUND } = {}) {
  const canvas = { getBoundingClientRect: () => ({ top: 50 }) };
  return {
    selectedEntity: entity,
    scene: { canvas, globe: { pick: jest.fn(() => ground) } },
    camera: {
      position: new Cartesian3(0, 0, 10000),
      heading: 0.1, pitch: -1.2, roll: 0,
      getPickRay: jest.fn(() => ({})),
      flyTo: jest.fn(),
    },
    dataSourceDisplay: {
      getBoundingSphere: jest.fn((e, allowPartial, result) => {
        Cartesian3.clone(ENTITY_POS, result.center);
        result.radius = 1;
        return sphereState;
      }),
    },
    __screen: screen,
  };
}

let toWindow;
beforeEach(() => {
  toWindow = jest.spyOn(SceneTransforms, "wgs84ToWindowCoordinates").mockImplementation((scene, pos) => scene.__screen);
  window.innerHeight = 900;
});
afterEach(() => toWindow.mockRestore());

function renderFocus(viewer, { selectedCZMLPoint = null, visibleSidePanel = [] } = {}) {
  viewer.scene.__screen = viewer.__screen;
  useCesium.mockReturnValue({ viewer });
  return render(
    <GraphicsWindowVisualsContext.Provider value={{ selectedCZMLPoint }}>
      <SidePanelContext.Provider value={{ visibleSidePanel }}>
        <SelectionFocus />
      </SidePanelContext.Provider>
    </GraphicsWindowVisualsContext.Provider>
  );
}

describe("coveredFromY", () => {
  it("is the sheet's top edge in canvas coordinates", () => {
    expect(coveredFromY({ getBoundingClientRect: () => ({ top: 50 }) }, 900)).toBe(400);
    expect(coveredFromY(undefined, 900)).toBe(450);
  });
});

describe("shiftToReveal", () => {
  it("moves the camera by the entity-to-target offset, keeping its orientation", () => {
    const viewer = makeViewer();
    viewer.scene.__screen = viewer.__screen;
    expect(shiftToReveal(viewer, viewer.selectedEntity, 400)).toBe(true);
    expect(viewer.camera.getPickRay).toHaveBeenCalledWith(new Cartesian2(300, 200)); // middle of the visible strip
    const { destination, orientation, duration } = viewer.camera.flyTo.mock.calls[0][0];
    expect(destination).toEqual(new Cartesian3(-100, -50, 10000)); // position + (entity - ground target)
    expect(orientation).toEqual({ heading: 0.1, pitch: -1.2, roll: 0 });
    expect(duration).toBeGreaterThan(0);
  });

  it("leaves the camera alone when the entity is already visible above the sheet", () => {
    const viewer = makeViewer({ screen: new Cartesian2(300, 300) });
    viewer.scene.__screen = viewer.__screen;
    expect(shiftToReveal(viewer, viewer.selectedEntity, 400)).toBe(false);
    expect(viewer.camera.flyTo).not.toHaveBeenCalled();
  });

  it("treats a feature just above the edge as covered", () => {
    const viewer = makeViewer({ screen: new Cartesian2(300, 390) });
    viewer.scene.__screen = viewer.__screen;
    expect(shiftToReveal(viewer, viewer.selectedEntity, 400)).toBe(true);
  });

  it("does nothing while the entity's visualization is pending or when the target has no ground", () => {
    const pending = makeViewer({ sphereState: BoundingSphereState.PENDING });
    pending.scene.__screen = pending.__screen;
    expect(shiftToReveal(pending, pending.selectedEntity, 400)).toBe(false);
    const sky = makeViewer({ ground: null }); // globe.pick finds nothing under the target
    sky.scene.__screen = sky.__screen;
    expect(shiftToReveal(sky, sky.selectedEntity, 400)).toBe(false);
    expect(sky.camera.flyTo).not.toHaveBeenCalled();
  });
});

describe("SelectionFocus", () => {
  it("clears the globe's selection when the app selection is cleared", () => {
    const viewer = makeViewer();
    const { rerender } = renderFocus(viewer, { selectedCZMLPoint: "point_7 [ds]", visibleSidePanel: [] });
    expect(viewer.selectedEntity).toBeDefined();
    rerender(
      <GraphicsWindowVisualsContext.Provider value={{ selectedCZMLPoint: null }}>
        <SidePanelContext.Provider value={{ visibleSidePanel: [] }}>
          <SelectionFocus />
        </SidePanelContext.Provider>
      </GraphicsWindowVisualsContext.Provider>
    );
    expect(viewer.selectedEntity).toBeUndefined();
  });

  it("shifts the view when a plot sheet opens over the selected feature, and not otherwise", () => {
    const viewer = makeViewer();
    renderFocus(viewer, { selectedCZMLPoint: "point_7 [ds]", visibleSidePanel: ["slide-panel-ds"] });
    expect(viewer.camera.flyTo).not.toHaveBeenCalled();
    renderFocus(viewer, { selectedCZMLPoint: "point_7 [ds]", visibleSidePanel: ["plotly-panel-ds"] });
    expect(viewer.camera.flyTo).toHaveBeenCalledTimes(1);
  });

  it("ignores a plot sheet when the globe's selection is not the app's", () => {
    const viewer = makeViewer({ entity: { id: "point_1 [other]" } });
    renderFocus(viewer, { selectedCZMLPoint: "point_7 [ds]", visibleSidePanel: ["plotly-panel-ds"] });
    expect(viewer.camera.flyTo).not.toHaveBeenCalled();
  });
});
