import { makeStaticMesh, makeTimeSeriesMesh } from "config/tests/mocks/meshMock";
import { LEGEND_GROUPS, compareLegends, hasLegend, sameLegendEntry } from "./legends";

describe("hasLegend", () => {
  it("is true for a dataset with legend images", () => {
    expect(hasLegend({ viz: { type: "czml", legend: ["a_legend.png"] } })).toBe(true);
  });

  it("is true for a glTF mesh whose time steps were drawn with a legend", () => {
    const mesh = makeTimeSeriesMesh();
    expect(mesh.viz.variables[0].timesteps[0].legend).toBeTruthy(); // the mock carries one
    expect(hasLegend({ ...mesh, viz: { ...mesh.viz, legend: [] } })).toBe(true);
  });

  it("is false without legend images or time step legends", () => {
    const mesh = makeStaticMesh();
    const bare = {
      ...mesh,
      viz: {
        ...mesh.viz,
        legend: [],
        variables: mesh.viz.variables.map((v) => ({ ...v, timesteps: v.timesteps.map((t) => ({ ...t, legend: null })) })),
      },
    };
    expect(hasLegend(bare)).toBe(false);
    expect(hasLegend({ viz: { type: "wms" } })).toBe(false);
    expect(hasLegend(undefined)).toBe(false);
  });
});

describe("compareLegends", () => {
  it("sorts by the order key lexicographically, then by registration sequence", () => {
    const entries = [
      { id: "real", order: [LEGEND_GROUPS.REALIZATION, 0, 1], seq: 0 },
      { id: "raster-layer-2", order: [LEGEND_GROUPS.RASTER, 1, 2], seq: 1 },
      { id: "mesh-b", order: [LEGEND_GROUPS.MESH, 0, 0], seq: 5 },
      { id: "mesh-a", order: [LEGEND_GROUPS.MESH, 0, 0], seq: 3 },
      { id: "raster-layer-1", order: [LEGEND_GROUPS.RASTER, 1, 1], seq: 4 },
      { id: "gis", order: [LEGEND_GROUPS.GIS, 2, 0], seq: 2 },
    ];
    expect([...entries].sort(compareLegends).map((e) => e.id)).toEqual([
      "mesh-a", "mesh-b", "gis", "raster-layer-1", "raster-layer-2", "real",
    ]);
  });

  it("treats a missing order as the lowest key", () => {
    expect(compareLegends({ seq: 1 }, { order: [0, 1], seq: 0 })).toBeLessThan(0);
  });
});

describe("sameLegendEntry", () => {
  const dataset = { id: "d" };
  const base = { id: "d", order: [3, 0, 1], dataset, uniqueId: "Nwt", legendUrls: ["a.png"], subtitle: "t" };

  it("is true when every field matches, arrays by content", () => {
    expect(sameLegendEntry(base, { ...base, order: [3, 0, 1], legendUrls: ["a.png"] })).toBe(true);
  });

  it("is false when a field, an array element or the dataset identity differs", () => {
    expect(sameLegendEntry(base, { ...base, legendUrls: ["b.png"] })).toBe(false);
    expect(sameLegendEntry(base, { ...base, order: [3, 0, 2] })).toBe(false);
    expect(sameLegendEntry(base, { ...base, dataset: { id: "d" } })).toBe(false);
    expect(sameLegendEntry(base, { ...base, subtitle: undefined })).toBe(false);
    expect(sameLegendEntry(base, undefined)).toBe(false);
  });
});
