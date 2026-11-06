import { render } from "@testing-library/react";

import { LegendsRegistryContext } from "react-tethys/context";
import useLegendEntry from "./useLegendEntry";

const Probe = (props) => {
  useLegendEntry(props);
  return null;
};

function renderProbe(props) {
  const registerLegend = jest.fn();
  const unregisterLegend = jest.fn();
  const wrap = (p) => (
    <LegendsRegistryContext.Provider value={{ registerLegend, unregisterLegend, setShowLegends: jest.fn() }}>
      <Probe {...p} />
    </LegendsRegistryContext.Provider>
  );
  const utils = render(wrap(props));
  return { ...utils, registerLegend, unregisterLegend, rerenderProbe: (p) => utils.rerender(wrap(p)) };
}

const dataset = { id: "ds-1", name: "Mesh", viz: { type: "gltf", legend: [] } };
const baseProps = {
  id: "ds-1",
  active: true,
  order: [0, 2, 0],
  dataset,
  uniqueId: "Nwt",
  legendUrls: ["fdb/a_legend.png"],
  subtitle: "2004-06-01T10:00:00",
  variable: { name: "Nwt" },
  realizationName: "Run 1",
};

it("registers the entry on mount and unregisters it on unmount", () => {
  const onColorRampChange = jest.fn();
  const { registerLegend, unregisterLegend, unmount } = renderProbe({ ...baseProps, onColorRampChange });
  expect(registerLegend).toHaveBeenCalledTimes(1);
  const [id, entry] = registerLegend.mock.calls[0];
  expect(id).toBe("ds-1");
  expect(entry).toMatchObject({
    id: "ds-1",
    order: [0, 2, 0],
    dataset,
    uniqueId: "Nwt",
    legendUrls: ["fdb/a_legend.png"],
    subtitle: "2004-06-01T10:00:00",
    variable: { name: "Nwt" },
    realizationName: "Run 1",
  });
  expect(unregisterLegend).not.toHaveBeenCalled();
  unmount();
  expect(unregisterLegend).toHaveBeenCalledWith("ds-1");
});

it("unregisters instead of registering while inactive", () => {
  const { registerLegend, unregisterLegend } = renderProbe({ ...baseProps, active: false });
  expect(registerLegend).not.toHaveBeenCalled();
  expect(unregisterLegend).toHaveBeenCalledWith("ds-1");
});

it("does not re-register for new arrays with the same content, but does when the content changes", () => {
  const { registerLegend, unregisterLegend, rerenderProbe } = renderProbe(baseProps);
  rerenderProbe({ ...baseProps, order: [0, 2, 0], legendUrls: ["fdb/a_legend.png"] });
  expect(registerLegend).toHaveBeenCalledTimes(1);
  rerenderProbe({ ...baseProps, legendUrls: ["fdb/b_legend.png"], subtitle: "2004-06-01T11:00:00" });
  expect(registerLegend).toHaveBeenCalledTimes(2);
  expect(registerLegend.mock.calls[1][1]).toMatchObject({ legendUrls: ["fdb/b_legend.png"], subtitle: "2004-06-01T11:00:00" });
  // The entry is replaced in place: it is never unregistered between refreshes, so it keeps its order.
  expect(unregisterLegend).not.toHaveBeenCalled();
});

it("unregisters the old id when the id changes", () => {
  const { registerLegend, unregisterLegend, rerenderProbe } = renderProbe(baseProps);
  rerenderProbe({ ...baseProps, id: "ds-2" });
  expect(unregisterLegend).toHaveBeenCalledWith("ds-1");
  expect(registerLegend).toHaveBeenLastCalledWith("ds-2", expect.objectContaining({ id: "ds-2" }));
});

it("keeps an empty legend url list empty", () => {
  const { registerLegend } = renderProbe({ ...baseProps, legendUrls: [] });
  expect(registerLegend.mock.calls[0][1].legendUrls).toEqual([]);
});

it("registers no legend urls when none are given", () => {
  const { registerLegend } = renderProbe({ ...baseProps, legendUrls: undefined });
  expect(registerLegend.mock.calls[0][1].legendUrls).toBeUndefined();
});

it("forwards ramp changes to the latest callback without re-registering", () => {
  const first = jest.fn();
  const second = jest.fn();
  const { registerLegend, rerenderProbe } = renderProbe({ ...baseProps, onColorRampChange: first });
  rerenderProbe({ ...baseProps, onColorRampChange: second });
  expect(registerLegend).toHaveBeenCalledTimes(1);
  registerLegend.mock.calls[0][1].onColorRampChange("viridis");
  expect(first).not.toHaveBeenCalled();
  expect(second).toHaveBeenCalledWith("viridis");
});
