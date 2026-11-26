import { render } from "@testing-library/react";
import { ClockRange, ClockStep, JulianDate } from "cesium";
import { useCesium } from "resium";

import { GraphicsWindowVisualsContext } from "react-tethys/context";
import { makeTimeSeriesMesh, makeValueLayer } from "config/tests/mocks/meshMock";
import { findVariable, makeActiveTimeSeries } from "lib/meshTimeSeries";
import { getClockTime } from "lib/clockTime";
import MeshClock, { CLOCK_TIME_INTERVAL_MS } from "./MeshClock";

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

  it("publishes the exact clock time for the plots, a few times a second at most, and clears it on unmount", () => {
    const now = jest.spyOn(Date, "now");
    now.mockReturnValue(1_000_000);
    const viewer = makeViewer();
    const { unmount } = renderClock(viewer, series);
    expect(getClockTime()).toBe(Date.UTC(2004, 5, 1, 0)); // the start, when the clock is set up
    const onTick = viewer.clock.onTick.addEventListener.mock.calls[0][0];

    onTick({ currentTime: JulianDate.fromIso8601("2004-06-01T03:00:00Z") }); // within a time step: still published
    expect(getClockTime()).toBe(Date.UTC(2004, 5, 1, 3));
    now.mockReturnValue(1_000_000 + CLOCK_TIME_INTERVAL_MS - 1);
    onTick({ currentTime: JulianDate.fromIso8601("2004-06-01T03:30:00Z") }); // too soon after the last one
    expect(getClockTime()).toBe(Date.UTC(2004, 5, 1, 3));
    now.mockReturnValue(1_000_000 + CLOCK_TIME_INTERVAL_MS);
    onTick({ currentTime: JulianDate.fromIso8601("2004-06-01T04:00:00Z") });
    expect(getClockTime()).toBe(Date.UTC(2004, 5, 1, 4));

    unmount();
    expect(getClockTime()).toBeNull();
    now.mockRestore();
  });

  it("publishes no clock time when no layer drives the clock", () => {
    const setMeshClockTime = jest.fn();
    const { rerender } = renderClock(makeViewer(), series, setMeshClockTime);
    expect(getClockTime()).not.toBeNull();
    rerender(
      <GraphicsWindowVisualsContext.Provider value={{ activeTimeSeries: null, setMeshClockTime }}>
        <MeshClock />
      </GraphicsWindowVisualsContext.Provider>
    ); // the layer that drove the clock is hidden
    expect(getClockTime()).toBeNull();
  });

  it("takes the clock back when something else changed its range (a CZML document with a clock was loaded)", () => {
    const viewer = makeViewer();
    const { setMeshClockTime } = renderClock(viewer, series);
    const clock = viewer.clock;
    const onTick = clock.onTick.addEventListener.mock.calls[0][0];
    // as Cesium does for a loaded document that carries a clock
    clock.startTime = JulianDate.fromIso8601("2004-06-01T00:00:00Z");
    clock.stopTime = JulianDate.fromIso8601("2004-07-01T00:00:00Z");
    clock.currentTime = JulianDate.fromIso8601("2004-06-20T00:00:00Z");
    clock.multiplier = 1;
    setMeshClockTime.mockClear();
    viewer.timeline.zoomTo.mockClear();

    onTick(clock);

    expect(JulianDate.equals(clock.startTime, JulianDate.fromIso8601(series.start))).toBe(true);
    expect(JulianDate.equals(clock.stopTime, JulianDate.fromIso8601(series.stop))).toBe(true);
    expect(JulianDate.equals(clock.currentTime, clock.startTime)).toBe(true);
    expect(clock.multiplier).toBe(72000);
    expect(viewer.timeline.zoomTo).toHaveBeenCalledWith(clock.startTime, clock.stopTime);
    expect(setMeshClockTime).toHaveBeenCalledWith(Date.UTC(2004, 5, 1, 0));
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
