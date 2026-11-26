import { useSyncExternalStore } from "react";

// The time of the map's clock, in ms since the epoch, for things that follow it closely (the time bar on a plot).
// It lives outside the React context on purpose: the context's meshClockTime changes once per time step and
// re-renders the map layers, while this changes several times a second and only reaches its subscribers.

let clockTime = null; // null: no layer drives the clock
const listeners = new Set();

/** Publish the clock time (null when no layer drives the clock). */
export function setClockTime(ms) {
  if (ms === clockTime) return;
  clockTime = ms;
  listeners.forEach((listener) => listener());
}

export const getClockTime = () => clockTime;

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const subscribeToNothing = () => () => {};
const noTime = () => null;

/** The clock time, re-rendering the caller when it changes; null (and no re-renders) while not enabled. */
export function useClockTime(enabled = true) {
  return useSyncExternalStore(enabled ? subscribe : subscribeToNothing, enabled ? getClockTime : noTime);
}
