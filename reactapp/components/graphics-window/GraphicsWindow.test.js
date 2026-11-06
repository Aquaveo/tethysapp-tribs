import { shallow } from "enzyme";
import { Viewer, Entity } from "resium";
import { Cartesian3 } from "cesium";
import GraphicsWindow, { planSelectionChange } from "./GraphicsWindow";
import { AppContext } from 'react-tethys/context';

const position = Cartesian3.fromDegrees(-74.0707383, 40.7117244, 100);
const pointGraphics = { pixelSize: 10 };

describe("GraphicsWindow Component", () => {
  // Apparently this doesn't need to be an actual key for the tests to pass right now
  // The thing that a key does is allowing rendering of maps on the globe.
  const Cesium_API_Key = "Mocked_Cesium_API_Key"
  const contextValue = {
    tethysApp: {
      customSettings: {
        Cesium_API_Key: {
          value: Cesium_API_Key
        }
      }
    }
  };
  it("renders without crashing", () => {
    const graphicsWindow = shallow(
      <AppContext.Provider value={contextValue}>
        <GraphicsWindow />
      </AppContext.Provider>
    );
    expect(graphicsWindow.exists()).toBe(true);
  });

  it("contains a Viewer component", () => {
    const wrapper = shallow(
      <AppContext.Provider value={contextValue}>
        <GraphicsWindow />
      </AppContext.Provider>
    );
    // When accessing components inside of the wrapper, they must be in a setTimeout fuction
    // AppContext.Provider seems to be an async function so some things need to be spread out in time.
    setTimeout(() => {
      const viewerComponent = wrapper.find(Viewer);
      expect(viewerComponent.exists()).toBe(true);
    }, 100);
  });

  it("contains an Entity component with specified position and point graphics", () => {
    const wrapper = shallow(
      <AppContext.Provider value={contextValue}>
        <GraphicsWindow />
      </AppContext.Provider>
    );
    setTimeout(() => {
      const entityProps = wrapper.find(Entity).props();

      expect(entityProps.position).toEqual(position);
      expect(entityProps.point).toEqual(pointGraphics);
    }, 100)
  });
});

describe("planSelectionChange", () => {
  const open = ["slide-panel-a", "plotly-panel-a", "plotly-panel-b"];

  it("closes every plot sheet and clears the selection when the globe selection is cleared", () => {
    expect(planSelectionChange(undefined, open)).toEqual({ selection: null, hide: ["plotly-panel-a", "plotly-panel-b"], show: null });
    expect(planSelectionChange("Loading...", open)).toEqual({ selection: null, hide: ["plotly-panel-a", "plotly-panel-b"], show: null });
    expect(planSelectionChange(undefined, []).hide).toEqual([]);
  });

  it("opens the selected dataset's plot sheet and closes the others", () => {
    expect(planSelectionChange("point_3 [c]", open)).toEqual({
      selection: "point_3 [c]", hide: ["plotly-panel-a", "plotly-panel-b"], show: "plotly-panel-c",
    });
  });

  it("keeps the sheet of a dataset whose other feature is selected, so the plot only refreshes", () => {
    expect(planSelectionChange("point_Outlet [a]", open)).toEqual({
      selection: "point_Outlet [a]", hide: ["plotly-panel-b"], show: "plotly-panel-a",
    });
  });

  it("treats an entity that belongs to no dataset as a changed selection with nothing to plot", () => {
    expect(planSelectionChange("some-other-entity", open)).toEqual({
      selection: "some-other-entity", hide: ["plotly-panel-a", "plotly-panel-b"], show: null,
    });
  });
});
