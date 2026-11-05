import { act, render } from "@testing-library/react";
import { useContext } from "react";

import { LegendsContext, LegendsProvider, LegendsRegistryContext } from "./context";

// Exposes the legends contexts to the test through a ref-like holder.
function renderLegendsProvider() {
  const seen = {};
  const Probe = () => {
    seen.state = useContext(LegendsContext);
    seen.actions = useContext(LegendsRegistryContext);
    return null;
  };
  const utils = render(
    <LegendsProvider>
      <Probe />
    </LegendsProvider>
  );
  return { ...utils, seen };
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("LegendsProvider", () => {
  it("starts with the panel closed and remembers the toggle in localStorage", () => {
    const { seen } = renderLegendsProvider();
    expect(seen.state.showLegends).toBe(false);
    act(() => seen.actions.setShowLegends(true));
    expect(seen.state.showLegends).toBe(true);
    expect(window.localStorage.getItem("showLegends")).toBe("true");
  });

  it("restores the toggle saved in localStorage", () => {
    window.localStorage.setItem("showLegends", "true");
    const { seen } = renderLegendsProvider();
    expect(seen.state.showLegends).toBe(true);
  });

  it("registers, replaces and unregisters legend entries, numbering them in registration order", () => {
    const { seen } = renderLegendsProvider();
    const dataset = { id: "a", name: "A" };
    act(() => {
      seen.actions.registerLegend("a", { order: [0, 0, 0], dataset, uniqueId: "a" });
      seen.actions.registerLegend("b", { order: [1, 0, 0], dataset: { id: "b" }, uniqueId: "b" });
    });
    expect(Object.keys(seen.state.legends)).toEqual(["a", "b"]);
    expect(seen.state.legends.a).toMatchObject({ id: "a", seq: 0, uniqueId: "a" });
    expect(seen.state.legends.b.seq).toBe(1);

    act(() => seen.actions.registerLegend("a", { order: [0, 0, 0], dataset, uniqueId: "a-renamed" }));
    expect(seen.state.legends.a).toMatchObject({ uniqueId: "a-renamed", seq: 0 }); // keeps its sequence number

    act(() => seen.actions.unregisterLegend("a"));
    expect(Object.keys(seen.state.legends)).toEqual(["b"]);
  });

  it("keeps the same state when an entry is re-registered unchanged", () => {
    const { seen } = renderLegendsProvider();
    const dataset = { id: "a", name: "A" };
    act(() => seen.actions.registerLegend("a", { order: [0, 0, 0], dataset, legendUrls: ["x.png"] }));
    const before = seen.state.legends;
    act(() => seen.actions.registerLegend("a", { order: [0, 0, 0], dataset, legendUrls: ["x.png"] }));
    expect(seen.state.legends).toBe(before);
    act(() => seen.actions.unregisterLegend("missing"));
    expect(seen.state.legends).toBe(before);
  });

  it("hands out stable actions", () => {
    const { seen, rerender } = renderLegendsProvider();
    const actions = seen.actions;
    act(() => seen.actions.setShowLegends(true));
    rerender(
      <LegendsProvider>
        <></>
      </LegendsProvider>
    );
    expect(seen.actions).toBe(actions);
  });
});
