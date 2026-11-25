import { render } from "@testing-library/react";
import { ClockRange, ClockStep, JulianDate } from "cesium";
import { useCesium } from "resium";

import { GraphicsWindowVisualsContext } from "react-tethys/context";
import { makeTimeSeriesMesh, makeValueLayer } from "config/tests/mocks/meshMock";
import { findVariable, makeActiveTimeSeries } from "lib/meshTimeSeries";
import MeshClock from "./MeshClock";

jest.mock("resium", () => ({ useCesium: jest.fn() }));

const makeViewer = () => ({
  clock: {
    onTick: { addEventListener: jest.fn(), removeEventListener: jest.fn() },
    currentTime: null,
    shouldAnimate: false,
  },
  timeline: { zoomTo: jest.fn() },
});

const renderClock = (viewer, activeTimeSeries, setMeshClockTime = jest.fn()) => {
  useCesium.mockReturnValue({ viewer });
  const utils = render(
    <GraphicsWindowVisualsContext.Provider value={{ activeTimeSeries, setMeshClockTime }}>
      <MeshClock />
    </GraphicsWindowVisualsContext.Provider>
  );
  return { ...utils, setMeshClockTime };
};

describe("MeshClock", () => {
  const dataset = makeTimeSeriesMesh();
  const series = makeActiveTimeSeries(dataset, findVariable(dataset, "Mu"));

  it("initializes the Cesium clock to the active variable, looping, without starting playback", () => {
    const viewer = makeViewer();
    viewer.clock.shouldAnimate = true;
    const { setMeshClockTime } = renderClock(viewer, series);
    const clock = viewer.clock;
    expect(JulianDate.equals(clock.startTime, JulianDate.fromIso8601(series.start))).toBe(true);
    expect(JulianDate.equals(clock.stopTime, JulianDate.fromIso8601(series.stop))).toBe(true);
    expect(JulianDate.equals(clock.currentTime, clock.startTime)).toBe(true);
    expect(clock.clockRange).toBe(ClockRange.LOOP_STOP);
    expect(clock.clockStep).toBe(ClockStep.SYSTEM_CLOCK_MULTIPLIER);
    expect(clock.multiplier).toBe(72000);
    expect(clock.shouldAnimate).toBe(false);
    expect(viewer.timeline.zoomTo).toHaveBeenCalledWith(clock.startTime, clock.stopTime);
    expect(clock.onTick.addEventListener).toHaveBeenCalledTimes(1);
    expect(setMeshClockTime).toHaveBeenCalledWith(Date.UTC(2004, 5, 1, 0));
  });

  it("publishes the clock time only when the time step index changes", () => {
    const viewer = makeViewer();
    const { setMeshClockTime } = renderClock(viewer, series);
    const onTick = viewer.clock.onTick.addEventListener.mock.calls[0][0];
    setMeshClockTime.mockClear();

    onTick({ currentTime: JulianDate.fromIso8601("2004-06-01T03:00:00Z") }); // still step 0
    expect(setMeshClockTime).not.toHaveBeenCalled();
    onTick({ currentTime: JulianDate.fromIso8601("2004-06-01T10:00:00Z") }); // step 1
    onTick({ currentTime: JulianDate.fromIso8601("2004-06-01T15:00:00Z") }); // still step 1
    expect(setMeshClockTime).toHaveBeenCalledTimes(1);
    expect(setMeshClockTime).toHaveBeenCalledWith(Date.UTC(2004, 5, 1, 10));
    onTick({ currentTime: JulianDate.fromIso8601("2004-06-01T00:00:00Z") }); // looped back to step 0
    expect(setMeshClockTime).toHaveBeenCalledTimes(2);
  });

  it("plays a value layer over the times of its rows and publishes the time once per clock step", () => {
    const layer = makeValueLayer(); // rows at 01:00, 02:00, 03:00
    const viewer = makeViewer();
    const { setMeshClockTime } = renderClock(viewer, makeActiveTimeSeries(layer, layer.viz.variables[0]));
    const clock = viewer.clock;
    expect(JulianDate.equals(clock.startTime, JulianDate.fromIso8601("2004-06-01T01:00:00Z"))).toBe(true);
    expect(JulianDate.equals(clock.stopTime, JulianDate.fromIso8601("2004-06-01T04:00:00Z"))).toBe(true);
    expect(clock.multiplier).toBe(7200);
    const onTick = clock.onTick.addEventListener.mock.calls[0][0];
    setMeshClockTime.mockClear();

    onTick({ currentTime: JulianDate.fromIso8601("2004-06-01T01:30:00Z") }); // still the first step
    expect(setMeshClockTime).not.toHaveBeenCalled();
    onTick({ currentTime: JulianDate.fromIso8601("2004-06-01T02:10:00Z") });
    onTick({ currentTime: JulianDate.fromIso8601("2004-06-01T02:50:00Z") });
    expect(setMeshClockTime).toHaveBeenCalledTimes(1);
    expect(setMeshClockTime).toHaveBeenCalledWith(Date.UTC(2004, 5, 1, 2, 10));
  });

  it("keeps the clock time when another variable takes over the clock and the time is in its range", () => {
    const layer = makeValueLayer(); // rows at 01:00, 02:00, 03:00; the clock runs to 04:00
    const viewer = makeViewer();
    const setMeshClockTime = jest.fn();
    const { rerender } = renderClock(viewer, series, setMeshClockTime);
    const kept = JulianDate.fromIso8601("2004-06-01T02:30:00Z");
    viewer.clock.currentTime = kept; // the user moved the time
    setMeshClockTime.mockClear();
    const next = makeActiveTimeSeries(layer, layer.viz.variables[0]);
    rerender(
      <GraphicsWindowVisualsContext.Provider value={{ activeTimeSeries: next, setMeshClockTime }}>
        <MeshClock />
      </GraphicsWindowVisualsContext.Provider>
    );
    const clock = viewer.clock;
    expect(JulianDate.equals(clock.currentTime, kept)).toBe(true);
    expect(JulianDate.equals(clock.startTime, JulianDate.fromIso8601(next.start))).toBe(true);
    expect(setMeshClockTime).toHaveBeenCalledWith(Date.UTC(2004, 5, 1, 2, 30));
    // The step of the kept time is the current one: a tick within it publishes nothing
    const onTick = clock.onTick.addEventListener.mock.calls[0][0];
    setMeshClockTime.mockClear();
    onTick({ currentTime: JulianDate.fromIso8601("2004-06-01T02:40:00Z") });
    expect(setMeshClockTime).not.toHaveBeenCalled();
  });

  it("rewinds to the start of the new range when the clock time lies outside it", () => {
    const layer = makeValueLayer();
    const viewer = makeViewer();
    const setMeshClockTime = jest.fn();
    const { rerender } = renderClock(viewer, series, setMeshClockTime);
    viewer.clock.currentTime = JulianDate.fromIso8601("2004-06-02T12:00:00Z"); // after the value layer's last row
    const next = makeActiveTimeSeries(layer, layer.viz.variables[0]);
    rerender(
      <GraphicsWindowVisualsContext.Provider value={{ activeTimeSeries: next, setMeshClockTime }}>
        <MeshClock />
      </GraphicsWindowVisualsContext.Provider>
    );
    expect(JulianDate.equals(viewer.clock.currentTime, JulianDate.fromIso8601(next.start))).toBe(true);
    expect(setMeshClockTime).toHaveBeenLastCalledWith(Date.UTC(2004, 5, 1, 1));
  });

  it("starts at the start of the range the first time, whatever time the viewer's clock has", () => {
    const viewer = makeViewer();
    viewer.clock.currentTime = JulianDate.fromIso8601("2004-06-01T10:00:00Z"); // inside the range, by chance
    renderClock(viewer, series);
    expect(JulianDate.equals(viewer.clock.currentTime, viewer.clock.startTime)).toBe(true);
  });

  it("keeps the clock time when the series is removed and then set again", () => {
    const viewer = makeViewer();
    const setMeshClockTime = jest.fn();
    const tree = (activeTimeSeries) => (
      <GraphicsWindowVisualsContext.Provider value={{ activeTimeSeries, setMeshClockTime }}>
        <MeshClock />
      </GraphicsWindowVisualsContext.Provider>
    );
    const { rerender } = renderClock(viewer, series, setMeshClockTime);
    const kept = JulianDate.fromIso8601("2004-06-01T10:00:00Z");
    viewer.clock.currentTime = kept;
    rerender(tree(null)); // the layer is hidden
    rerender(tree({ ...series })); // and shown again
    expect(JulianDate.equals(viewer.clock.currentTime, kept)).toBe(true);
  });

  it("starts at the start of the range on the clock of another viewer", () => {
    const setMeshClockTime = jest.fn();
    const { rerender } = renderClock(makeViewer(), series, setMeshClockTime);
    const other = makeViewer();
    other.clock.currentTime = JulianDate.fromIso8601("2004-06-01T10:00:00Z"); // not a time the user chose
    useCesium.mockReturnValue({ viewer: other });
    rerender(
      <GraphicsWindowVisualsContext.Provider value={{ activeTimeSeries: series, setMeshClockTime }}>
        <MeshClock />
      </GraphicsWindowVisualsContext.Provider>
    );
    expect(JulianDate.equals(other.clock.currentTime, other.clock.startTime)).toBe(true);
  });

  it("stops animating when there is no active time series and removes its listener on unmount", () => {
    const viewer = makeViewer();
    viewer.clock.shouldAnimate = true;
    const { unmount } = renderClock(viewer, null);
    expect(viewer.clock.shouldAnimate).toBe(false);
    expect(viewer.timeline.zoomTo).not.toHaveBeenCalled();
    unmount();
    expect(viewer.clock.onTick.removeEventListener).toHaveBeenCalledTimes(1);
  });
});
