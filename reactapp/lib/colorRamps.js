/**
 * Color ramps a user can pick for glTF mesh datasets.
 *
 * The meshes written by tribs-adapter (tRIBSMeshViz.to_gltf) store each cell's value already normalized to 0..1
 * as its texture coordinate (v; 0 = the variable's minimum, 1 = its maximum) and carry one baked color ramp
 * texture. The default ramp here is that baked texture. Every other ramp is sampled in the browser from a small
 * texture built with d3-scale-chromatic (see GltfLayers getRampShader), so switching ramps never touches the files.
 *
 * Pure module: no cesium import, so it is cheap to test.
 */
// Imported from the d3 sub-packages (dependencies of the declared "d3" package) rather than the "d3" umbrella,
// whose d3-delaunay dependency is not transformed by jest.
import {
  interpolateBlues,
  interpolateBrBG,
  interpolateCividis,
  interpolateGreens,
  interpolateInferno,
  interpolateMagma,
  interpolatePlasma,
  interpolateRdYlBu,
  interpolateSpectral,
  interpolateTurbo,
  interpolateViridis,
  interpolateYlGnBu,
} from "d3-scale-chromatic";
import { rgb } from "d3-color";

/** The ramp baked into the glTF files (templates/color_ramps/TopoAtlasShader.png). It has no interpolator. */
export const DEFAULT_RAMP = "topo_atlas";
export const RAMP_TEXTURE_WIDTH = 256;
export const LEGEND_TICK_COUNT = 5;

/** Ordered as shown in the selector. Interpolators map t in 0..1 (min..max) to a CSS color string. */
export const COLOR_RAMPS = [
  { name: DEFAULT_RAMP, label: "Topo Atlas (default)", interpolator: null },
  { name: "viridis", label: "Viridis", interpolator: interpolateViridis },
  { name: "plasma", label: "Plasma", interpolator: interpolatePlasma },
  { name: "inferno", label: "Inferno", interpolator: interpolateInferno },
  { name: "magma", label: "Magma", interpolator: interpolateMagma },
  { name: "cividis", label: "Cividis", interpolator: interpolateCividis },
  { name: "turbo", label: "Turbo", interpolator: interpolateTurbo },
  { name: "ylgnbu", label: "Yellow-Green-Blue", interpolator: interpolateYlGnBu },
  // Diverging ramps are reversed so blue is low and red is high, as users expect for hydrologic variables.
  { name: "rdylbu", label: "Blue-Yellow-Red", interpolator: (t) => interpolateRdYlBu(1 - t) },
  { name: "spectral", label: "Spectral", interpolator: (t) => interpolateSpectral(1 - t) },
  { name: "blues", label: "Blues", interpolator: interpolateBlues },
  { name: "greens", label: "Greens", interpolator: interpolateGreens },
  { name: "terrain", label: "Terrain (Brown-Green)", interpolator: interpolateBrBG },
];

/** The ramp with the given name; unknown or missing names (e.g. a ramp removed later) fall back to the default. */
export function findRamp(name) {
  return COLOR_RAMPS.find((ramp) => ramp.name === name) ?? COLOR_RAMPS[0];
}

export function isDefaultRamp(name) {
  return findRamp(name).name === DEFAULT_RAMP;
}

/** Options for a select input. */
export function rampOptions() {
  return COLOR_RAMPS.map(({ name, label }) => ({ value: name, label }));
}

/**
 * The ramp a dataset should be drawn with: the unsaved selection made in this session (GraphicsWindowVisualsContext
 * colorRamps) wins over the ramp saved on the dataset (attributes.color_ramp), which wins over the default.
 */
export function resolveRampName(dataset, colorRamps) {
  return findRamp(colorRamps?.[dataset?.id] ?? dataset?.attributes?.color_ramp).name;
}

const texelCache = new Map();

/**
 * RGBA bytes of a ``width`` x 1 texture of the ramp: texel i is the ramp color at i / (width - 1), so sampling at
 * u = v (the cell's normalized value) gives its color. Cached per ramp; only for ramps with an interpolator.
 */
export function rampTexels(name, width = RAMP_TEXTURE_WIDTH) {
  const ramp = findRamp(name);
  if (!ramp.interpolator) {
    throw new Error(`Color ramp "${ramp.name}" is baked into the glTF files and has no texture.`);
  }
  const key = `${ramp.name}:${width}`;
  if (!texelCache.has(key)) {
    const texels = new Uint8Array(width * 4);
    for (let i = 0; i < width; i++) {
      const color = rgb(ramp.interpolator(i / (width - 1)));
      texels.set([color.r, color.g, color.b, 255], i * 4);
    }
    texelCache.set(key, texels);
  }
  return texelCache.get(key);
}

/** Gradient stops ``[{offset: 0..1, color}]`` for drawing the ramp as a legend bar or swatch (CSS/SVG). */
export function rampStops(name, count = 32) {
  const ramp = findRamp(name);
  if (!ramp.interpolator) return [];
  return Array.from({ length: count }, (_, i) => {
    const offset = i / (count - 1);
    return { offset, color: rgb(ramp.interpolator(offset)).formatRgb() };
  });
}

/**
 * Evenly spaced legend tick values from min to max, like the server-drawn legend (tRIBSMeshViz._generate_legend),
 * which labels a zero range as min..min + 1.
 */
export function legendTicks(min, max, count = LEGEND_TICK_COUNT) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
  const high = max > min ? max : min + 1;
  return Array.from({ length: count }, (_, i) => min + ((high - min) * i) / (count - 1));
}
