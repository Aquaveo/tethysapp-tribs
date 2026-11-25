import { renderHook, waitFor } from "@testing-library/react";
import { toast } from "react-toastify";

import { makeLayerValues } from "config/tests/mocks/meshMock";
import { clearValuesCache } from "lib/layerValues";
import useLayerValues, { useLayerValuesState } from "./useLayerValues";

const respond = (body, ok = true, status = 200) => Promise.resolve({ ok, status, json: () => Promise.resolve(body) });

beforeEach(() => {
  clearValuesCache();
});

it("returns null while the values load, then the parsed file", async () => {
  global.fetch = jest.fn(() => respond(makeLayerValues()));
  const { result } = renderHook(() => useLayerValues("/media/values/000_Nwt_mm.json"));
  expect(result.current).toBeNull();
  await waitFor(() => expect(result.current).toMatchObject({ variable: "Nwt_mm", hours: [1, 2, 3] }));
  expect(global.fetch).toHaveBeenCalledWith("/media/values/000_Nwt_mm.json");
});

it("fetches nothing without a url", () => {
  global.fetch = jest.fn();
  const { result } = renderHook(() => useLayerValues(null));
  expect(result.current).toBeNull();
  expect(global.fetch).not.toHaveBeenCalled();
});

it("never returns the values of the previous url for the new one", async () => {
  global.fetch = jest.fn((url) => respond(makeLayerValues("d", url.includes("Srf") ? "Srf_mm" : "Nwt_mm")));
  const { result, rerender } = renderHook(({ url }) => useLayerValues(url), {
    initialProps: { url: "/media/values/000_Nwt_mm.json" },
  });
  await waitFor(() => expect(result.current?.variable).toBe("Nwt_mm"));
  rerender({ url: "/media/values/001_Srf_mm.json" });
  expect(result.current).toBeNull(); // not Nwt_mm
  await waitFor(() => expect(result.current?.variable).toBe("Srf_mm"));
});

it("logs a file that cannot be loaded, tells the user once and returns null", async () => {
  const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  const toastError = jest.spyOn(toast, "error").mockImplementation(() => {});
  global.fetch = jest.fn(() => respond(null, false, 404));
  const { result } = renderHook(() => useLayerValues("/media/values/missing.json"));
  await waitFor(() => expect(consoleError).toHaveBeenCalled());
  expect(String(consoleError.mock.calls[0][0])).toMatch(/404/);
  expect(toastError).toHaveBeenCalledWith(
    expect.stringMatching(/Could not load the values/),
    { toastId: "layer-values-/media/values/missing.json" } // one message per file
  );
  expect(result.current).toBeNull();
  consoleError.mockRestore();
  toastError.mockRestore();
});

describe("useLayerValuesState", () => {
  it("is loading until the file of the url is there, and again for a newly selected url", async () => {
    global.fetch = jest.fn((url) => respond(makeLayerValues("d", url.includes("Srf") ? "Srf_mm" : "Nwt_mm")));
    const { result, rerender } = renderHook(({ url }) => useLayerValuesState(url), {
      initialProps: { url: "/media/values/000_Nwt_mm.json" },
    });
    expect(result.current).toEqual({ values: null, loading: true });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.values.variable).toBe("Nwt_mm");
    rerender({ url: "/media/values/001_Srf_mm.json" });
    expect(result.current).toEqual({ values: null, loading: true });
    await waitFor(() => expect(result.current.values?.variable).toBe("Srf_mm"));
  });

  it("is not loading without a url, nor after a file could not be loaded", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    const toastError = jest.spyOn(toast, "error").mockImplementation(() => {});
    global.fetch = jest.fn(() => respond(null, false, 404));
    const { result, rerender } = renderHook(({ url }) => useLayerValuesState(url), { initialProps: { url: null } });
    expect(result.current).toEqual({ values: null, loading: false });
    rerender({ url: "/media/values/missing.json" });
    await waitFor(() => expect(toastError).toHaveBeenCalled());
    await waitFor(() => expect(result.current).toEqual({ values: null, loading: false }));
    consoleError.mockRestore();
    toastError.mockRestore();
  });
});
