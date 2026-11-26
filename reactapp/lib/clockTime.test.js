import { act, renderHook } from "@testing-library/react";

import { getClockTime, setClockTime, useClockTime } from "./clockTime";

afterEach(() => {
  act(() => setClockTime(null));
});

it("gives its subscribers the published clock time", () => {
  const { result } = renderHook(() => useClockTime());
  expect(result.current).toBeNull();
  act(() => setClockTime(1000));
  expect(result.current).toBe(1000);
  expect(getClockTime()).toBe(1000);
  act(() => setClockTime(null));
  expect(result.current).toBeNull();
});

it("gives no time and does not re-render while not enabled", () => {
  let renders = 0;
  const { result, rerender } = renderHook(({ enabled }) => {
    renders += 1;
    return useClockTime(enabled);
  }, { initialProps: { enabled: false } });
  act(() => setClockTime(2000));
  expect(result.current).toBeNull();
  expect(renders).toBe(1);
  rerender({ enabled: true });
  expect(result.current).toBe(2000);
});
