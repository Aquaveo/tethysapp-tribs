/* eslint-disable react/prop-types -- the resium CzmlDataSource mock below just echoes its props */
import { act, render, screen } from "@testing-library/react";

import { GraphicsWindowVisualsContext, ProjectContext } from "react-tethys/context";
import { makeLayerValues, makeMrfDataset, makeValueLayer } from "config/tests/mocks/meshMock";
import { DO_NOT_SET_LAYER } from "constants/GraphicsWindowConstants";
import CzmlLayer, { colorFeatures, featureColor } from "./CzmlLayers";

const mockSources = {};
jest.mock("resium", () => ({
  CzmlDataSource: (props) => {
    // eslint-disable-next-line no-undef
    mockSources[props.data] = props;
    return <div data-testid="czml" data-url={props.data} data-show={String(props.show)} />;
  },
}));
// The values of the selected variable, as the hook returns them once loaded (null while loading). A plain
// function, not jest.fn: the jest config resets mock implementations before every test.
let mockValuesByUrl = {};
let mockLoadingUrls = [];
jest.mock("hooks/useLayerValues", () => ({
  __esModule: true,
  // eslint-disable-next-line no-undef
  useLayerValuesState: (url) => ({ values: mockValuesByUrl[url] ?? null, loading: mockLoadingUrls.includes(url) }),
}));

const T0 = Date.UTC(2004, 5, 1, 0);
const HOUR = 60 * 60 * 1000;
const projectId = "project-1";
const WHITE = [255, 255, 255, 255];
const BLUE = [0, 0, 255, 255];
const GRAY = [160, 160, 160, 255];

/** A loaded data source with the two points of makeLayerValues. */
function makeDataSource(dataset) {
  const entities = {
    [`point_42 [${dataset.id}]`]: { point: { color: null } },
    [`point_1656 [${dataset.id}]`]: { point: { color: null } },
  };
  return { entities: { getById: (id) => entities[id], values: Object.values(entities) }, features: entities };
}

const bytes = (dataSource, node, dataset) => dataSource.features[`point_${node} [${dataset.id}]`].point.color?.toBytes();

function layerTree(dataset, { selected = "Nwt_mm", meshClockTime = null, colorRamps = {}, visible = true } = {}) {
  const value = {
    visibleObjects: { [projectId]: visible ? [dataset.id] : [] },
    visibleCZMLObject: { [dataset.id]: selected },
    meshClockTime,
    colorRamps,
  };
  return (
    <ProjectContext.Provider value={{ projectId }}>
      <GraphicsWindowVisualsContext.Provider value={value}>
        <CzmlLayer dataset={dataset} />
      </GraphicsWindowVisualsContext.Provider>
    </ProjectContext.Provider>
  );
}

/** Render a value layer whose document and values have loaded. */
function renderLoaded(dataset, options) {
  const utils = render(layerTree(dataset, options));
  const dataSource = makeDataSource(dataset);
  act(() => mockSources["/media/" + dataset.viz.url[0]].onLoad(dataSource));
  return { ...utils, dataSource, rerenderWith: (next) => utils.rerender(layerTree(dataset, next)) };
}

beforeEach(() => {
  process.env.TETHYS_MEDIA_URL = "/media/";
  Object.keys(mockSources).forEach((key) => delete mockSources[key]);
  const dataset = makeValueLayer();
  mockLoadingUrls = [];
  mockValuesByUrl = {
    ["/media/" + dataset.viz.variables[0].values]: makeLayerValues(dataset.id, "Nwt_mm"),
    ["/media/" + dataset.viz.variables[1].values]: { ...makeLayerValues(dataset.id, "Srf_mm"), values: [[0, 0, 0], [0, 0, 0]] },
  };
});

describe("value layers", () => {
  it("loads the one document of the dataset and shows it while a variable is selected", () => {
    const dataset = makeValueLayer();
    render(layerTree(dataset));
    const sources = screen.getAllByTestId("czml");
    expect(sources).toHaveLength(1);
    expect(sources[0]).toHaveAttribute("data-url", "/media/" + dataset.viz.url[0]);
    expect(sources[0]).toHaveAttribute("data-show", "true");
  });

  it("hides the document when the dataset is hidden or has no layer selected", () => {
    const dataset = makeValueLayer();
    const { rerender } = render(layerTree(dataset, { visible: false }));
    expect(screen.getByTestId("czml")).toHaveAttribute("data-show", "false");
    rerender(layerTree(dataset, { selected: DO_NOT_SET_LAYER }));
    expect(screen.getByTestId("czml")).toHaveAttribute("data-show", "false");
  });

  it("colors each feature by its value at the first row until the clock has a time", () => {
    const dataset = makeValueLayer(); // Nwt_mm: min 0, max 100; node 42 = 0, 50, 100; node 1656 = 100, null, 0
    const { dataSource } = renderLoaded(dataset);
    expect(bytes(dataSource, 42, dataset)).toEqual(WHITE); // the minimum on the white to blue default
    expect(bytes(dataSource, 1656, dataset)).toEqual(BLUE); // the maximum
  });

  it("follows the clock: the row of the last time at or before it, gray where there is no value", () => {
    const dataset = makeValueLayer();
    const { dataSource, rerenderWith } = renderLoaded(dataset, { meshClockTime: T0 + 2.5 * HOUR }); // row of hour 2
    expect(bytes(dataSource, 42, dataset)).toEqual([128, 128, 255, 255]); // 50 of 0..100
    expect(bytes(dataSource, 1656, dataset)).toEqual(GRAY);
    rerenderWith({ meshClockTime: T0 + 3 * HOUR });
    expect(bytes(dataSource, 42, dataset)).toEqual(BLUE);
    expect(bytes(dataSource, 1656, dataset)).toEqual(WHITE);
  });

  it("recolors with a newly picked ramp and with another variable without loading the document again", () => {
    const dataset = makeValueLayer();
    const { dataSource, rerenderWith } = renderLoaded(dataset);
    const loaded = mockSources["/media/" + dataset.viz.url[0]];
    rerenderWith({ colorRamps: { [dataset.id]: "viridis" } });
    expect(bytes(dataSource, 42, dataset)).toEqual([68, 1, 84, 255]); // viridis at the minimum
    rerenderWith({ selected: "Srf_mm" }); // every value 0, range 0..0: the low end of the default ramp
    expect(bytes(dataSource, 1656, dataset)).toEqual(WHITE);
    // Still the same single document: a selected feature stays selected
    expect(screen.getAllByTestId("czml")).toHaveLength(1);
    expect(Object.keys(mockSources)).toEqual(["/media/" + dataset.viz.url[0]]);
    expect(mockSources["/media/" + dataset.viz.url[0]].data).toBe(loaded.data);
  });

  it("shows the features without colors when there are no values for the selected variable", () => {
    const dataset = makeValueLayer();
    mockValuesByUrl = {};
    const { dataSource } = renderLoaded(dataset);
    expect(bytes(dataSource, 42, dataset)).toEqual(GRAY);
  });

  it("keeps the colors it has while the values of a newly selected variable load, then recolors", () => {
    const dataset = makeValueLayer();
    const srfUrl = "/media/" + dataset.viz.variables[1].values;
    const srfValues = mockValuesByUrl[srfUrl];
    const { dataSource, rerenderWith } = renderLoaded(dataset);
    expect(bytes(dataSource, 1656, dataset)).toEqual(BLUE); // Nwt_mm
    delete mockValuesByUrl[srfUrl];
    mockLoadingUrls = [srfUrl];
    rerenderWith({ selected: "Srf_mm" });
    expect(bytes(dataSource, 1656, dataset)).toEqual(BLUE); // no gray flash
    mockValuesByUrl[srfUrl] = srfValues;
    mockLoadingUrls = [];
    rerenderWith({ selected: "Srf_mm" }); // the loaded values arrive with a render
    expect(bytes(dataSource, 1656, dataset)).toEqual(WHITE);
  });

  it("drops the colors of the previous variable when the values of the new one could not be loaded", () => {
    const dataset = makeValueLayer();
    const { dataSource, rerenderWith } = renderLoaded(dataset);
    expect(bytes(dataSource, 1656, dataset)).toEqual(BLUE); // Nwt_mm
    delete mockValuesByUrl["/media/" + dataset.viz.variables[1].values]; // Srf_mm failed to load
    rerenderWith({ selected: "Srf_mm" });
    expect(bytes(dataSource, 1656, dataset)).toEqual(GRAY);
    expect(bytes(dataSource, 42, dataset)).toEqual(GRAY);
  });

  it("colors the basin polygon of basin averaged output", () => {
    const dataset = makeValueLayer();
    const polygonId = `polygon [${dataset.id}]`;
    mockValuesByUrl = {
      ["/media/" + dataset.viz.variables[0].values]: { ...makeLayerValues(dataset.id), ids: [polygonId], values: [[100, 0, 50]] },
    };
    render(layerTree(dataset));
    const polygon = { polygon: { material: null } };
    const dataSource = { entities: { getById: (id) => (id === polygonId ? polygon : undefined), values: [polygon] } };
    act(() => mockSources["/media/" + dataset.viz.url[0]].onLoad(dataSource));
    expect(polygon.polygon.material.toBytes()).toEqual([0, 0, 255, 175]);
  });
});

describe("featureColor / colorFeatures", () => {
  const variable = { min: 0, max: 100 };

  it("gives a polygon its own alpha and a missing value gray", () => {
    expect(featureColor("white_blue", 100, variable, 175).toBytes()).toEqual([0, 0, 255, 175]);
    expect(featureColor("white_blue", null, variable, 175).toBytes()).toEqual([160, 160, 160, 175]);
  });

  it("colors points and polygons, and skips ids the document does not have", () => {
    const polygon = { polygon: { material: null } };
    const point = { point: { color: null } };
    const dataSource = { entities: { getById: (id) => ({ a: polygon, b: point })[id] } };
    const values = { ids: ["a", "b", "gone"], values: [[100], [0], [5]] };

    expect(colorFeatures(dataSource, values, 0, "white_blue", variable)).toBe(2);

    expect(polygon.polygon.material.toBytes()).toEqual([0, 0, 255, 175]);
    expect(point.point.color.toBytes()).toEqual(WHITE);
  });
});

describe("CZML written with its colors", () => {
  it("still loads the document of the selected layer (station data, output visualized before value layers)", () => {
    const dataset = makeMrfDataset();
    render(layerTree(dataset, { selected: "MDGW" }));
    const source = screen.getByTestId("czml");
    expect(source).toHaveAttribute("data-url", "/media/" + dataset.viz.url[1]);
    expect(source).toHaveAttribute("data-show", "true");
  });
});
