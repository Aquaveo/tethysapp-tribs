import { makeTimeSeriesMesh, makeValueLayer } from "config/tests/mocks/meshMock";
import {
  COLOR_RAMPS,
  DEFAULT_RAMP,
  DEFAULT_VALUE_RAMP,
  defaultRampFor,
  findRamp,
  isDefaultRamp,
  legendTicks,
  rampColor,
  rampOptions,
  rampStops,
  rampTexels,
  rampsFor,
  resolveRampName,
} from "./colorRamps";

describe("ramp registry", () => {
  it("lists the baked default ramp first and every other ramp with an interpolator", () => {
    expect(COLOR_RAMPS[0].name).toBe(DEFAULT_RAMP);
    expect(COLOR_RAMPS[0].interpolator).toBeNull();
    expect(COLOR_RAMPS.slice(1).every((ramp) => typeof ramp.interpolator === "function")).toBe(true);
    expect(new Set(COLOR_RAMPS.map((ramp) => ramp.name)).size).toBe(COLOR_RAMPS.length);
  });

  it("falls back to the default for unknown or missing names", () => {
    expect(findRamp("viridis").label).toBe("Viridis");
    expect(findRamp("no-such-ramp").name).toBe(DEFAULT_RAMP);
    expect(findRamp(undefined).name).toBe(DEFAULT_RAMP);
    expect(isDefaultRamp(null)).toBe(true);
    expect(isDefaultRamp("viridis")).toBe(false);
  });

  it("offers a glTF mesh the baked ramp first and every picked ramp, but not the value layer default", () => {
    const options = rampOptions(makeTimeSeriesMesh());
    expect(options[0]).toEqual({ value: DEFAULT_RAMP, label: "Topo Atlas (default)" });
    expect(options.map((option) => option.value)).toEqual(
      COLOR_RAMPS.map((ramp) => ramp.name).filter((name) => name !== DEFAULT_VALUE_RAMP)
    );
    expect(rampOptions(undefined)).toEqual(options);
  });

  it("offers a value layer white-blue first and every picked ramp, but not the baked glTF ramp", () => {
    const dataset = makeValueLayer();
    expect(defaultRampFor(dataset)).toBe(DEFAULT_VALUE_RAMP);
    expect(defaultRampFor(makeTimeSeriesMesh())).toBe(DEFAULT_RAMP);
    const options = rampOptions(dataset);
    expect(options[0]).toEqual({ value: DEFAULT_VALUE_RAMP, label: "White-Blue (default)" });
    expect(options.map((option) => option.value)).not.toContain(DEFAULT_RAMP);
    expect(options).toHaveLength(COLOR_RAMPS.length - 1);
    expect(rampsFor(dataset).every((ramp) => typeof ramp.interpolator === "function")).toBe(true);
  });

  it("draws a value layer with its own default until a ramp it offers is picked", () => {
    const dataset = makeValueLayer();
    expect(resolveRampName(dataset, {})).toBe(DEFAULT_VALUE_RAMP);
    expect(resolveRampName({ ...dataset, attributes: { color_ramp: "viridis" } }, {})).toBe("viridis");
    expect(resolveRampName({ ...dataset, attributes: { color_ramp: "viridis" } }, { [dataset.id]: "turbo" })).toBe("turbo");
    // The baked glTF ramp cannot color a value layer, and a glTF mesh does not take the value layer default
    expect(resolveRampName({ ...dataset, attributes: { color_ramp: DEFAULT_RAMP } }, {})).toBe(DEFAULT_VALUE_RAMP);
    expect(resolveRampName({ ...makeTimeSeriesMesh(), attributes: { color_ramp: DEFAULT_VALUE_RAMP } }, {})).toBe(DEFAULT_RAMP);
  });

  it("prefers the session selection over the saved attribute over the default", () => {
    const dataset = { id: "d1", attributes: { color_ramp: "plasma" } };
    expect(resolveRampName(dataset, { d1: "viridis" })).toBe("viridis");
    expect(resolveRampName(dataset, { other: "viridis" })).toBe("plasma");
    expect(resolveRampName(dataset, undefined)).toBe("plasma");
    expect(resolveRampName({ id: "d2", attributes: {} }, {})).toBe(DEFAULT_RAMP);
    expect(resolveRampName({ id: "d3", attributes: { color_ramp: "gone" } }, {})).toBe(DEFAULT_RAMP);
  });
});

describe("rampTexels", () => {
  it("builds a 256 x 1 RGBA texture from min color to max color", () => {
    const texels = rampTexels("viridis");
    expect(texels).toBeInstanceOf(Uint8Array);
    expect(texels.length).toBe(256 * 4);
    expect(Array.from(texels.slice(0, 4))).toEqual([68, 1, 84, 255]); // d3 viridis(0) = #440154
    expect(Array.from(texels.slice(255 * 4))).toEqual([253, 231, 37, 255]); // d3 viridis(1) = #fde725
    for (let i = 3; i < texels.length; i += 4) expect(texels[i]).toBe(255);
  });

  it("is cached per ramp and refuses the baked default ramp", () => {
    expect(rampTexels("turbo")).toBe(rampTexels("turbo"));
    expect(rampTexels("turbo")).not.toBe(rampTexels("viridis"));
    expect(() => rampTexels(DEFAULT_RAMP)).toThrow(/baked/);
  });

  it("reverses diverging ramps so blue is low", () => {
    const texels = rampTexels("rdylbu");
    const [r0, , b0] = texels.slice(0, 3);
    const [r1, , b1] = texels.slice(255 * 4, 255 * 4 + 3);
    expect(b0).toBeGreaterThan(r0);
    expect(r1).toBeGreaterThan(b1);
  });
});

describe("legend helpers", () => {
  it("spaces ticks evenly between min and max", () => {
    expect(legendTicks(0, 10)).toEqual([0, 2.5, 5, 7.5, 10]);
    expect(legendTicks(-2, 2, 3)).toEqual([-2, 0, 2]);
  });

  it("labels a zero range as min..min + 1 like the server legend, and nothing without a range", () => {
    expect(legendTicks(3, 3)).toEqual([3, 3.25, 3.5, 3.75, 4]);
    expect(legendTicks(null, 4)).toEqual([]);
    expect(legendTicks(1, undefined)).toEqual([]);
  });

  it("gives gradient stops from the ramp's first to last color", () => {
    const stops = rampStops("viridis", 3);
    expect(stops.map((stop) => stop.offset)).toEqual([0, 0.5, 1]);
    expect(stops[0].color).toBe("rgb(68, 1, 84)");
    expect(stops[2].color).toBe("rgb(253, 231, 37)");
    expect(rampStops(DEFAULT_RAMP)).toEqual([]);
  });
});

describe("rampColor", () => {
  it("samples a ramp from its minimum to its maximum color", () => {
    expect(rampColor(DEFAULT_VALUE_RAMP, 0)).toEqual({ r: 255, g: 255, b: 255 }); // white
    expect(rampColor(DEFAULT_VALUE_RAMP, 1)).toEqual({ r: 0, g: 0, b: 255 }); // blue
    expect(rampColor(DEFAULT_VALUE_RAMP, 0.5)).toEqual({ r: 128, g: 128, b: 255 });
    expect(rampColor("viridis", 0)).toEqual({ r: 68, g: 1, b: 84 });
  });

  it("clamps outside 0..1 and refuses the baked glTF ramp", () => {
    expect(rampColor(DEFAULT_VALUE_RAMP, -3)).toEqual(rampColor(DEFAULT_VALUE_RAMP, 0));
    expect(rampColor(DEFAULT_VALUE_RAMP, 9)).toEqual(rampColor(DEFAULT_VALUE_RAMP, 1));
    expect(() => rampColor(DEFAULT_RAMP, 0.5)).toThrow(/baked/);
  });
});
