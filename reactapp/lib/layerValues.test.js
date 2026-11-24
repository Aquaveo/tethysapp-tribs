import { makeLayerValues, makeMrfDataset, makeTimeSeriesMesh, makeValueLayer } from "config/tests/mocks/meshMock";
import {
  clearValuesCache,
  fetchValues,
  findValueVariable,
  hasValues,
  normalize,
  rowIndexForTime,
  rowTime,
} from "./layerValues";

const T0 = Date.UTC(2004, 5, 1, 0);
const HOUR = 60 * 60 * 1000;

describe("hasValues / findValueVariable", () => {
  it("is true only for CZML datasets whose variables name a values file", () => {
    expect(hasValues(makeValueLayer())).toBe(true);
    expect(hasValues(makeMrfDataset())).toBe(false); // visualized before value layers: one CZML per variable
    expect(hasValues(makeTimeSeriesMesh())).toBe(false);
    expect(hasValues({ viz: { type: "czml", url: [] } })).toBe(false);
    expect(hasValues(undefined)).toBe(false);
  });

  it("finds a value variable by its layer name", () => {
    const dataset = makeValueLayer();
    expect(findValueVariable(dataset, "Srf_mm").label).toBe("Srf");
    expect(findValueVariable(dataset, "Nope")).toBeNull();
    expect(findValueVariable(dataset, undefined)).toBeNull();
    expect(findValueVariable(makeMrfDataset(), "MAP")).toBeNull();
  });
});

describe("rowIndexForTime", () => {
  const values = makeLayerValues(); // rows at hours 1, 2, 3

  it.each([
    ["before the first row", T0, 0],
    ["exactly at a row", T0 + 2 * HOUR, 1],
    ["between two rows", T0 + 2.5 * HOUR, 1],
    ["at the last row", T0 + 3 * HOUR, 2],
    ["after the last row", T0 + 50 * HOUR, 2],
  ])("shows the last row at or before the time: %s", (_, time, expected) => {
    expect(rowIndexForTime(values, time)).toBe(expected);
  });

  it("accepts ISO strings and Dates", () => {
    expect(rowIndexForTime(values, "2004-06-01T02:00:00Z")).toBe(1);
    expect(rowIndexForTime(values, new Date(T0 + 3 * HOUR))).toBe(2);
  });

  it("uses the row times, not an even stride", () => {
    const uneven = { ...values, hours: [0.0625, 0.125, 6, 6.0625] };
    expect(rowIndexForTime(uneven, T0 + 3 * HOUR)).toBe(1);
    expect(rowIndexForTime(uneven, T0 + 6 * HOUR)).toBe(2);
  });

  it("is not thrown off by rounding in the clock time", () => {
    const fine = { ...values, hours: [0.0625, 0.125, 0.1875] };
    expect(rowIndexForTime(fine, T0 + 0.125 * HOUR - 1)).toBe(1); // 1 ms early
  });

  it("shows the first row without a time, without a start date or with a single row", () => {
    expect(rowIndexForTime(values, null)).toBe(0);
    expect(rowIndexForTime({ ...values, start: null }, T0 + 3 * HOUR)).toBe(0);
    expect(rowIndexForTime({ ...values, hours: [5] }, T0 + 9 * HOUR)).toBe(0);
    expect(rowIndexForTime(undefined, T0)).toBe(0);
  });
});

describe("rowTime", () => {
  it("is the start of the run plus the hours of the row", () => {
    expect(rowTime(makeLayerValues(), 1)).toBe("2004-06-01T02:00:00Z");
    expect(rowTime({ start: "2004-06-01T00:00:00Z", hours: [0.0625] }, 0)).toBe("2004-06-01T00:03:45Z");
  });

  it("is null without a start date or for a row that does not exist", () => {
    expect(rowTime({ ...makeLayerValues(), start: null }, 0)).toBeNull();
    expect(rowTime(makeLayerValues(), 7)).toBeNull();
    expect(rowTime(undefined, 0)).toBeNull();
  });
});

describe("normalize", () => {
  it.each([
    [0, 0],
    [25, 0.25],
    [100, 1],
    [-5, 0], // clamped
    [250, 1],
  ])("places %p between the minimum and the maximum", (value, expected) => {
    expect(normalize(value, 0, 100)).toBe(expected);
  });

  it("puts every value of a variable without a range at the low end", () => {
    expect(normalize(7, 7, 7)).toBe(0);
    expect(normalize(7, null, null)).toBe(0);
    expect(normalize(7, undefined, 9)).toBe(0);
  });

  it("is null for a missing value", () => {
    expect(normalize(null, 0, 100)).toBeNull();
    expect(normalize(undefined, 0, 100)).toBeNull();
    expect(normalize(NaN, 0, 100)).toBeNull();
  });
});

describe("fetchValues", () => {
  beforeEach(() => clearValuesCache());

  const respond = (body, ok = true, status = 200) => ({ ok, status, json: () => Promise.resolve(body) });

  it("fetches a values file once and shares it", async () => {
    const fetcher = jest.fn(() => Promise.resolve(respond(makeLayerValues())));
    const first = await fetchValues("/media/values/000_Nwt_mm.json", fetcher);
    const second = await fetchValues("/media/values/000_Nwt_mm.json", fetcher);
    expect(first.hours).toEqual([1, 2, 3]);
    expect(second).toBe(first);
    expect(fetcher).toHaveBeenCalledTimes(1);
    await fetchValues("/media/values/001_Srf_mm.json", fetcher);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("rejects when the file cannot be loaded and tries again next time", async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce(respond(null, false, 404))
      .mockResolvedValueOnce(respond(makeLayerValues()));
    await expect(fetchValues("/media/values/x.json", fetcher)).rejects.toThrow(/404/);
    await expect(fetchValues("/media/values/x.json", fetcher)).resolves.toMatchObject({ variable: "Nwt_mm" });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
