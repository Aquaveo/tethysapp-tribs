import { makeMesh, makeMrfDataset, makeTimeSeriesMesh } from "config/tests/mocks/meshMock";
import {
  describeLayer,
  groupByTier,
  isLayerOf,
  layerEntries,
  splitUnitToken,
  variableLabel,
  variableTitle,
  variableUnits,
} from "./outputVariables";

describe("splitUnitToken", () => {
  it("splits a header unit token off a layer name", () => {
    expect(splitUnitToken("Nwt_mm")).toEqual({ base: "Nwt", units: "mm" });
    expect(splitUnitToken("Qstrm_m3-s")).toEqual({ base: "Qstrm", units: "m³/s" });
    expect(splitUnitToken("Srf_Hour_mm")).toEqual({ base: "Srf_Hour", units: "mm" });
    expect(splitUnitToken("ShrtRadIn_dir_W-m2")).toEqual({ base: "ShrtRadIn_dir", units: "W/m²" });
    expect(splitUnitToken("Press_Pa")).toEqual({ base: "Press", units: "Pa" });
  });

  it("treats [] as no units and leaves names without a known token alone", () => {
    expect(splitUnitToken("Srf_[]")).toEqual({ base: "Srf", units: null });
    expect(splitUnitToken("MAP")).toEqual({ base: "MAP", units: null });
    expect(splitUnitToken("LngRadOutW-m2_")).toEqual({ base: "LngRadOutW-m2_", units: null });
    expect(splitUnitToken("Bedrock_Depth_furlongs")).toEqual({ base: "Bedrock_Depth_furlongs", units: null });
    expect(splitUnitToken(undefined)).toEqual({ base: "", units: null });
  });
});

describe("describeLayer / labels", () => {
  it("uses the backend's entry when the dataset carries one", () => {
    const mrf = makeMrfDataset();
    const mdgw = describeLayer(mrf, "MDGW");
    expect(mdgw.label).toBe("Depth to Groundwater");
    expect(variableTitle(mdgw)).toBe("Depth to Groundwater (m)");
    expect(variableLabel(mdgw)).toBe("Depth to Groundwater");
    expect(variableUnits(mdgw)).toBe("m");
  });

  it("falls back to the layer name and its unit token otherwise", () => {
    const mesh = makeMesh("x"); // viz.url only
    expect(describeLayer(mesh, "Nwt_mm")).toEqual({ name: "Nwt_mm", label: "Nwt", units: "mm", tier: null, description: "" });
    expect(variableTitle(describeLayer(mesh, "Nwt_mm"))).toBe("Nwt (mm)");
    expect(variableTitle(describeLayer(mesh, "MAP"))).toBe("MAP");
    expect(variableTitle({ name: "Mu" })).toBe("Mu"); // an old viz.variables entry without label/units
    expect(variableTitle({ name: "Mu", label: "Mu", units: null })).toBe("Mu");
    expect(variableTitle(null)).toBe("");
  });

  it("knows which names are layers of a dataset", () => {
    const mrf = makeMrfDataset();
    expect(isLayerOf(mrf, "MAP")).toBe(true);
    expect(isLayerOf(mrf, "RainMax")).toBe(false);
    expect(isLayerOf(mrf, mrf.id)).toBe(false);
    const mesh = makeMesh("x");
    expect(isLayerOf(mesh, "out_examplebasin_Z")).toBe(true);
    expect(isLayerOf(mesh, null)).toBe(false);
    // WMS datasets carry one endpoint string, not a list of layer files
    const wms = { ...mesh, viz: { type: "wms", url: "http://host/geoserver/wms", legend: ["http://host/legend"] } };
    expect(isLayerOf(wms, wms.id)).toBe(false);
    expect(layerEntries(wms)).toEqual([]);
  });
});

describe("layerEntries / groupByTier", () => {
  it("keeps the backend order and splits secondary variables into the collapsed group", () => {
    const mrf = makeMrfDataset();
    const entries = layerEntries(mrf);
    expect(entries.map((e) => e.name)).toEqual(["MAP", "MDGW", "Srf", "MSM100"]);
    const { primary, more } = groupByTier(entries);
    expect(primary.map((e) => e.name)).toEqual(["MAP", "MDGW"]);
    expect(more.map((e) => e.name)).toEqual(["Srf", "MSM100"]);
  });

  it("lists untiered variables up front", () => {
    const mesh = makeTimeSeriesMesh();
    const { primary, more } = groupByTier(layerEntries(mesh));
    expect(primary.map((e) => e.name)).toEqual(["Mu", "Nwt"]);
    expect(more).toEqual([]);
    const urlsOnly = makeMesh("x");
    expect(layerEntries(urlsOnly).map((e) => e.name)).toEqual(["out_examplebasin_Z"]);
  });
});
