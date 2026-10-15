import { render } from "@testing-library/react";
import { ClockRange, ClockStep, JulianDate } from "cesium";
import { useCesium } from "resium";

import { GraphicsWindowVisualsContext } from "react-tethys/context";
import { makeTimeSeriesMesh } from "config/tests/mocks/meshMock";
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
