import { makeMesh, makeStaticMesh, makeTimeSeriesMesh } from "config/tests/mocks/meshMock";
import {
  clockSettingsForVariable,
  findVariable,
  formatTimestepTime,
  getVariables,
  isoToUtcMs,
  isTimeDynamic,
  makeActiveTimeSeries,
  timestepForTime,
  timestepIndexForTime,
} from "./meshTimeSeries";

const T0 = Date.UTC(2004, 5, 1, 0);
const HOUR = 60 * 60 * 1000;

describe("isoToUtcMs", () => {
  it("treats naive ISO strings as UTC", () => {
    expect(isoToUtcMs("2004-06-01T00:00:00")).toBe(T0);
    expect(isoToUtcMs("2004-06-01T00:00:00Z")).toBe(T0);
  });
  it("passes through numbers and Dates and rejects garbage", () => {
    expect(isoToUtcMs(T0)).toBe(T0);
    expect(isoToUtcMs(new Date(T0))).toBe(T0);
    expect(isoToUtcMs(null)).toBeNull();
    expect(isoToUtcMs("not a date")).toBeNull();
  });
});

describe("getVariables / findVariable / isTimeDynamic", () => {
  it("returns null for datasets without variables", () => {
    expect(getVariables(makeMesh("x"))).toBeNull();
    expect(getVariables({})).toBeNull();
    expect(findVariable(makeMesh("x"), "Mu")).toBeNull();
  });
  it("finds variables by name", () => {
    const dataset = makeTimeSeriesMesh();
    expect(getVariables(dataset)).toHaveLength(2);
    expect(findVariable(dataset, "Nwt").name).toBe("Nwt");
    expect(findVariable(dataset, "Nope")).toBeNull();
  });
  it("only time series with a start and several steps are time dynamic", () => {
    expect(isTimeDynamic(findVariable(makeTimeSeriesMesh(), "Mu"))).toBe(true);
    expect(isTimeDynamic(getVariables(makeStaticMesh())[0])).toBe(false);
    expect(isTimeDynamic(null)).toBe(false);
  });
});

describe("timestepIndexForTime", () => {
  const mu = findVariable(makeTimeSeriesMesh(), "Mu");
  const nwt = findVariable(makeTimeSeriesMesh(), "Nwt");

  it("selects the last step at or before the time", () => {
    expect(timestepIndexForTime(mu, T0)).toBe(0);
    expect(timestepIndexForTime(mu, T0 + 5 * HOUR)).toBe(0);
    expect(timestepIndexForTime(mu, T0 + 10 * HOUR)).toBe(1);
    expect(timestepIndexForTime(mu, T0 + 15 * HOUR)).toBe(1);
    expect(timestepIndexForTime(mu, T0 + 20 * HOUR)).toBe(2);
  });
  it("clamps before the start and after the end", () => {
    expect(timestepIndexForTime(mu, T0 - HOUR)).toBe(0);
    expect(timestepIndexForTime(mu, T0 + 500 * HOUR)).toBe(2);
  });
  it("uses the actual step times so a variable missing a step still indexes correctly", () => {
    expect(timestepIndexForTime(nwt, T0 + 10 * HOUR)).toBe(0);
    expect(timestepIndexForTime(nwt, T0 + 20 * HOUR)).toBe(1);
  });
  it("accepts ISO strings and falls back to the first step", () => {
    expect(timestepIndexForTime(mu, "2004-06-01T10:00:00Z")).toBe(1);
    expect(timestepIndexForTime(mu, null)).toBe(0);
    expect(timestepIndexForTime(getVariables(makeStaticMesh())[0], T0)).toBe(0);
    expect(timestepIndexForTime(null, T0)).toBe(0);
  });
  it("timestepForTime returns the step itself", () => {
    expect(timestepForTime(mu, T0 + 12 * HOUR).hours).toBe(10);
    expect(timestepForTime(null, T0)).toBeNull();
  });
});

describe("clockSettingsForVariable / makeActiveTimeSeries", () => {
  it("plays one step per half second of wall time", () => {
    const mu = findVariable(makeTimeSeriesMesh(), "Mu");
    expect(clockSettingsForVariable(mu)).toEqual({
      start: "2004-06-01T00:00:00Z",
      stop: "2004-06-01T20:00:00Z",
      stepHours: 10,
      multiplier: 72000,
      count: 3,
    });
  });
  it("falls back to the last time step when end is missing", () => {
    const mu = { ...findVariable(makeTimeSeriesMesh(), "Mu"), end: null };
    expect(clockSettingsForVariable(mu).stop).toBe("2004-06-01T20:00:00Z");
  });
  it("builds the activeTimeSeries context value", () => {
    const dataset = makeTimeSeriesMesh();
    const series = makeActiveTimeSeries(dataset, findVariable(dataset, "Nwt"));
    expect(series).toMatchObject({ datasetId: dataset.id, variableName: "Nwt", multiplier: 144000, count: 2 });
    expect(series.variable.name).toBe("Nwt");
  });
});

it("formatTimestepTime renders a short UTC label", () => {
  expect(formatTimestepTime("2004-06-01T10:00:00Z")).toBe("2004-06-01 10:00");
  expect(formatTimestepTime(null)).toBeNull();
});
