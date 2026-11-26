import { useCallback, useContext, useEffect, useRef } from "react";
import { useCesium } from "resium";
import { ClockRange, ClockStep, JulianDate } from "cesium";

import { GraphicsWindowVisualsContext } from "react-tethys/context";
import { setClockTime } from "lib/clockTime";
import { timestepIndexForTime } from "lib/meshTimeSeries";

// How often, at most, the exact clock time is published for what follows it closely (the time bar on a plot)
export const CLOCK_TIME_INTERVAL_MS = 100;

/** Whether a clock runs over the range of a time series. */
const hasRange = (clock, series) => (
  Boolean(clock.startTime) && Boolean(clock.stopTime) &&
  JulianDate.equals(clock.startTime, JulianDate.fromIso8601(series.start)) &&
  JulianDate.equals(clock.stopTime, JulianDate.fromIso8601(series.stop))
);

/**
 * Drives the Cesium clock from the active glTF mesh time series and publishes the clock time to the
 * GraphicsWindowVisualsContext (meshClockTime) whenever the active variable's time step changes.
 *
 * The clock is configured imperatively (resium's <Clock> compares props with !== so fresh JulianDates would reset
 * it on every render). Must be rendered inside a resium <Viewer>. Renders nothing.
 */
const MeshClock = () => {
  const { viewer } = useCesium();
  const { activeTimeSeries, setMeshClockTime } = useContext(GraphicsWindowVisualsContext);
  const seriesRef = useRef(activeTimeSeries);
  const lastIndexRef = useRef(-1);
  const lastPublishRef = useRef(0); // wall time the exact clock time was last published at
  seriesRef.current = activeTimeSeries;

  // (Re)initialize the clock to a variable's range, looping, one time step per ~0.5 s of wall time.
  // Playback is never started here: the user starts and stops it with the animation widget.
  const applySeries = useCallback((series) => {
    const clock = viewer.clock;
    const startTime = JulianDate.fromIso8601(series.start);
    const stopTime = JulianDate.fromIso8601(series.stop);
    clock.startTime = startTime;
    clock.stopTime = stopTime;
    clock.currentTime = JulianDate.clone(startTime);
    clock.clockRange = ClockRange.LOOP_STOP;
    clock.clockStep = ClockStep.SYSTEM_CLOCK_MULTIPLIER;
    clock.multiplier = series.multiplier;
    clock.shouldAnimate = false;
    viewer.timeline?.zoomTo(startTime, stopTime);
    lastIndexRef.current = 0;
    setMeshClockTime(JulianDate.toDate(startTime).getTime());
    setClockTime(JulianDate.toDate(startTime).getTime());
  }, [viewer, setMeshClockTime]);

  useEffect(() => {
    if (!viewer?.clock) return;
    if (!activeTimeSeries?.start || !activeTimeSeries?.stop) {
      viewer.clock.shouldAnimate = false;
      setClockTime(null);
      return;
    }
    applySeries(activeTimeSeries);
  }, [viewer, activeTimeSeries, applySeries]);

  // One tick listener; only write to context when the active variable's time step index changes.
  useEffect(() => {
    if (!viewer?.clock) return undefined;
    const onTick = (clock) => {
      const series = seriesRef.current;
      if (!series?.variable) return;
      // Cesium gives the viewer's clock to a CZML document that has one when it loads (station data, even while
      // hidden), which can be after the clock was set up here. The active variable takes the clock back.
      if (series.start && series.stop && !hasRange(viewer.clock, series)) {
        applySeries(series);
        return;
      }
      const ms = JulianDate.toDate(clock.currentTime).getTime();
      const now = Date.now();
      if (now - lastPublishRef.current >= CLOCK_TIME_INTERVAL_MS) {
        lastPublishRef.current = now;
        setClockTime(ms);
      }
      const index = timestepIndexForTime(series.variable, ms);
      if (index !== lastIndexRef.current) {
        lastIndexRef.current = index;
        setMeshClockTime(ms);
      }
    };
    viewer.clock.onTick.addEventListener(onTick);
    return () => {
      viewer.clock.onTick.removeEventListener(onTick);
      setClockTime(null);
    };
  }, [viewer, setMeshClockTime, applySeries]);

  return null;
};

export default MeshClock;
