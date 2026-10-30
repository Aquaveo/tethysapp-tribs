/* eslint-disable react/prop-types -- the resium Model mock below just echoes its props */
import { act, render, screen } from "@testing-library/react";

import { GraphicsWindowVisualsContext, ProjectContext } from "react-tethys/context";
import { makeMesh, makeStaticMesh, makeTimeSeriesMesh } from "config/tests/mocks/meshMock";
import GltfLayer, { desiredGltfUrl, getHillshadeShader, getRampShader } from "./GltfLayers";

const mockModelProps = {};
jest.mock("resium", () => ({
  Model: (props) => {
    // eslint-disable-next-line no-undef
    mockModelProps[props.url] = props;
    return <div data-testid="model" data-url={props.url} data-show={String(props.show)} />;
  },
}));
// Plain functions, not jest.fn: the jest config resets mock implementations before every test.
jest.mock("cesium", () => ({
  Cartesian3: { fromDegrees: () => ({}) },
  CustomShader: function CustomShader(options) { this.options = options; },
  LightingModel: { UNLIT: "UNLIT" },
  TextureUniform: function TextureUniform(options) { this.options = options; },
  Transforms: { northUpEastToFixedFrame: () => ({ matrix: true }) },
  UniformType: { SAMPLER_2D: "sampler2D" },
}));

const T0 = Date.UTC(2004, 5, 1, 0);
const HOUR = 60 * 60 * 1000;
const projectId = "project-1";

const renderLayer = (dataset, visibleCZMLObject, meshClockTime, colorRamps = {}) => {
  const value = { visibleObjects: { [projectId]: [dataset.id] }, visibleCZMLObject, meshClockTime, colorRamps };
  const tree = (
    <ProjectContext.Provider value={{ projectId }}>
      <GraphicsWindowVisualsContext.Provider value={value}>
        <GltfLayer dataset={dataset} />
      </GraphicsWindowVisualsContext.Provider>
    </ProjectContext.Provider>
  );
  const utils = render(tree);
  const rerenderAt = (time, selected = visibleCZMLObject) =>
    utils.rerender(
      <ProjectContext.Provider value={{ projectId }}>
        <GraphicsWindowVisualsContext.Provider value={{ ...value, visibleCZMLObject: selected, meshClockTime: time }}>
          <GltfLayer dataset={dataset} />
        </GraphicsWindowVisualsContext.Provider>
      </ProjectContext.Provider>
    );
  return { ...utils, rerenderAt };
};

const models = () => screen.queryAllByTestId("model").map((el) => ({
  url: el.getAttribute("data-url"),
  show: el.getAttribute("data-show") === "true",
}));

describe("desiredGltfUrl", () => {
  it("picks the time step of the selected variable", () => {
    const dataset = makeTimeSeriesMesh();
    expect(desiredGltfUrl(dataset, { [dataset.id]: "Mu" }, T0)).toContain("0000_00i_Mu.glb");
    expect(desiredGltfUrl(dataset, { [dataset.id]: "Mu" }, T0 + 12 * HOUR)).toContain("0010_00i_Mu.glb");
    expect(desiredGltfUrl(dataset, { [dataset.id]: "Nwt" }, T0 + 12 * HOUR)).toContain("0000_00i_Nwt.glb");
  });
  it("defaults to the first variable and keeps the url behaviour for datasets without variables", () => {
    const dataset = makeTimeSeriesMesh();
    expect(desiredGltfUrl(dataset, {}, null)).toContain("0000_00i_Mu.glb");
    const mesh = makeMesh("x");
    expect(desiredGltfUrl(mesh, {}, null)).toBe(mesh.viz.url[0]);
  });
});

describe("GltfLayer double buffering", () => {
  beforeEach(() => {
    process.env.TETHYS_MEDIA_URL = "/media/";
  });

  it("keeps the current model visible until the next time step is ready", () => {
    const dataset = makeTimeSeriesMesh();
    const selected = { [dataset.id]: "Mu" };
    const { rerenderAt } = renderLayer(dataset, selected, T0);

    expect(models()).toEqual([{ url: "/media/" + dataset.viz.variables[0].timesteps[0].url, show: true }]);

    rerenderAt(T0 + 10 * HOUR);
    const step1 = "/media/" + dataset.viz.variables[0].timesteps[1].url;
    expect(models()).toEqual([
      { url: "/media/" + dataset.viz.variables[0].timesteps[0].url, show: true },
      { url: step1, show: false },
    ]);

    act(() => mockModelProps[step1].onReady());
    expect(models()).toEqual([{ url: step1, show: true }]);
  });

  it("replaces an in-flight load when the desired time step changes again", () => {
    const dataset = makeTimeSeriesMesh();
    const selected = { [dataset.id]: "Mu" };
    const { rerenderAt } = renderLayer(dataset, selected, T0);
    rerenderAt(T0 + 10 * HOUR);
    rerenderAt(T0 + 20 * HOUR);
    const step2 = "/media/" + dataset.viz.variables[0].timesteps[2].url;
    expect(models().map((m) => m.url)).toEqual(["/media/" + dataset.viz.variables[0].timesteps[0].url, step2]);
    act(() => mockModelProps[step2].onReady());
    expect(models()).toEqual([{ url: step2, show: true }]);
  });

  it("switches variables through the hidden slot too", () => {
    const dataset = makeTimeSeriesMesh();
    const { rerenderAt } = renderLayer(dataset, { [dataset.id]: "Mu" }, T0);
    rerenderAt(T0, { [dataset.id]: "Nwt" });
    const nwt0 = "/media/" + dataset.viz.variables[1].timesteps[0].url;
    expect(models().map((m) => m.url)).toContain(nwt0);
    act(() => mockModelProps[nwt0].onReady());
    expect(models()).toEqual([{ url: nwt0, show: true }]);
  });

  it("shades every model with a viewer-fixed light instead of the sun", () => {
    const dataset = makeTimeSeriesMesh();
    renderLayer(dataset, { [dataset.id]: "Mu" }, T0);
    const props = mockModelProps["/media/" + dataset.viz.variables[0].timesteps[0].url];
    expect(props.customShader.options.lightingModel).toBe("UNLIT");
    expect(props.customShader.options.fragmentShaderText).toContain("fsInput.attributes.normalEC");
    expect(props.customShader.options.uniforms).toBeUndefined(); // default ramp: the color baked into the file
    expect(props.customShader).toBe(getHillshadeShader());
  });

  it("colors the model with the ramp saved on the dataset, on both slots across a time step swap", () => {
    const dataset = { ...makeTimeSeriesMesh(), attributes: { color_ramp: "viridis" } };
    const { rerenderAt } = renderLayer(dataset, { [dataset.id]: "Mu" }, T0);
    rerenderAt(T0 + 10 * HOUR);
    const [step0, step1] = dataset.viz.variables[0].timesteps.map((t) => "/media/" + t.url);
    const shader = mockModelProps[step0].customShader;
    expect(mockModelProps[step1].customShader).toBe(shader);
    expect(shader).toBe(getRampShader("viridis"));
    expect(shader).not.toBe(getHillshadeShader());
    expect(shader.options.lightingModel).toBe("UNLIT");
    const glsl = shader.options.fragmentShaderText;
    expect(glsl).toContain("fsInput.attributes.texCoord_0");
    expect(glsl).toContain("texture(u_colorRamp");
    expect(glsl).toContain("discard");
    expect(glsl).toContain("fsInput.attributes.normalEC");
    const texture = shader.options.uniforms.u_colorRamp;
    expect(texture.type).toBe("sampler2D");
    expect(texture.value.options).toMatchObject({ width: 256, height: 1, repeat: false });
    expect(texture.value.options.typedArray).toBeInstanceOf(Uint8Array);
    expect(texture.value.options.typedArray.length).toBe(256 * 4);
  });

  it("shares one shader per ramp and lets the session selection override the saved ramp", () => {
    expect(getRampShader("turbo")).toBe(getRampShader("turbo"));
    expect(getRampShader("turbo")).not.toBe(getRampShader("viridis"));
    expect(getRampShader("no-such-ramp")).toBe(getHillshadeShader());

    const dataset = { ...makeStaticMesh(), attributes: { color_ramp: "viridis" } };
    renderLayer(dataset, {}, null, { [dataset.id]: "turbo" });
    const props = mockModelProps["/media/" + dataset.viz.url[0]];
    expect(props.customShader).toBe(getRampShader("turbo"));
  });

  it("hides the model when the dataset is not visible and renders nothing without an origin", () => {
    const dataset = makeTimeSeriesMesh();
    const value = { visibleObjects: { [projectId]: [] }, visibleCZMLObject: {}, meshClockTime: null };
    render(
      <ProjectContext.Provider value={{ projectId }}>
        <GraphicsWindowVisualsContext.Provider value={value}>
          <GltfLayer dataset={dataset} />
          <GltfLayer dataset={{ ...makeMesh("y"), viz: { ...makeMesh("y").viz, origin: undefined } }} />
        </GraphicsWindowVisualsContext.Provider>
      </ProjectContext.Provider>
    );
    expect(models()).toEqual([{ url: "/media/" + dataset.viz.variables[0].timesteps[0].url, show: false }]);
  });
});
