import { useContext, useEffect, useRef } from "react";
import { useCesium } from "resium";
import { ClockRange, ClockStep, JulianDate } from "cesium";

import { GraphicsWindowVisualsContext } from "react-tethys/context";
import { timestepIndexForTime } from "lib/meshTimeSeries";

const isWithin = (time, start, stop) => (
  Boolean(time) && JulianDate.lessThanOrEquals(start, time) && JulianDate.lessThanOrEquals(time, stop)
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
  const initializedClockRef = useRef(null); // the clock this component has set up
  seriesRef.current = activeTimeSeries;

  // (Re)initialize the clock to the active variable's range, looping, one time step per ~0.5 s of wall time.
  // When another variable takes over the clock, the time is kept if it lies in the new range, so the layers that
  // follow the clock stay on their time step; otherwise (and the first time) the clock starts at the range's start.
  // Playback is never started here: the user starts and stops it with the animation widget.
  useEffect(() => {
    if (!viewer?.clock) return;
    const clock = viewer.clock;
    if (!activeTimeSeries?.start || !activeTimeSeries?.stop) {
      clock.shouldAnimate = false;
      return;
    }
    const startTime = JulianDate.fromIso8601(activeTimeSeries.start);
    const stopTime = JulianDate.fromIso8601(activeTimeSeries.stop);
    clock.startTime = startTime;
    clock.stopTime = stopTime;
    const keepTime = initializedClockRef.current === clock && isWithin(clock.currentTime, startTime, stopTime);
    const currentTime = keepTime ? JulianDate.clone(clock.currentTime) : JulianDate.clone(startTime);
    initializedClockRef.current = clock;
    clock.currentTime = currentTime;
    clock.clockRange = ClockRange.LOOP_STOP;
    clock.clockStep = ClockStep.SYSTEM_CLOCK_MULTIPLIER;
    clock.multiplier = activeTimeSeries.multiplier;
    clock.shouldAnimate = false;
    viewer.timeline?.zoomTo(startTime, stopTime);
    const ms = JulianDate.toDate(currentTime).getTime();
    lastIndexRef.current = activeTimeSeries.variable ? timestepIndexForTime(activeTimeSeries.variable, ms) : 0;
    setMeshClockTime(ms);
  }, [viewer, activeTimeSeries, setMeshClockTime]);

  // One tick listener; only write to context when the active variable's time step index changes.
  useEffect(() => {
    if (!viewer?.clock) return undefined;
    const onTick = (clock) => {
      const series = seriesRef.current;
      if (!series?.variable) return;
      const ms = JulianDate.toDate(clock.currentTime).getTime();
      const index = timestepIndexForTime(series.variable, ms);
      if (index !== lastIndexRef.current) {
        lastIndexRef.current = index;
        setMeshClockTime(ms);
      }
    };
    viewer.clock.onTick.addEventListener(onTick);
    return () => viewer.clock.onTick.removeEventListener(onTick);
  }, [viewer, setMeshClockTime]);

  return null;
};

export default MeshClock;
