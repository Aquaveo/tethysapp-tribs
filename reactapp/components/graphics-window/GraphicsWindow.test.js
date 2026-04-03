import { shallow } from "enzyme";
import { Viewer, Entity } from "resium";
import { Cartesian3 } from "cesium";
import GraphicsWindow from "./GraphicsWindow";
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
