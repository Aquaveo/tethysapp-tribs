import { useContext, useEffect, useRef } from "react";
import { useCesium } from "resium";
import { ClockRange, ClockStep, JulianDate } from "cesium";

import { GraphicsWindowVisualsContext } from "react-tethys/context";
import { timestepIndexForTime } from "lib/meshTimeSeries";

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
  seriesRef.current = activeTimeSeries;

  // (Re)initialize the clock to the active variable's range, looping, one time step per ~0.5 s of wall time.
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
    clock.currentTime = JulianDate.clone(startTime);
    clock.clockRange = ClockRange.LOOP_STOP;
    clock.clockStep = ClockStep.SYSTEM_CLOCK_MULTIPLIER;
    clock.multiplier = activeTimeSeries.multiplier;
    clock.shouldAnimate = true;
    viewer.timeline?.zoomTo(startTime, stopTime);
    lastIndexRef.current = 0;
    setMeshClockTime(JulianDate.toDate(startTime).getTime());
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
