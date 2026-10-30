import { render, screen } from "@testing-library/react";

import GltfLegend from "./GltfLegend";

it("draws a gradient bar of the ramp labelled from min to max", () => {
  render(<GltfLegend rampName="viridis" min={0} max={10} variableName="Mu" />);
  const ticks = screen.getAllByTestId("gltf-legend-tick").map((el) => el.textContent);
  expect(ticks).toEqual(["0.00", "2.50", "5.00", "7.50", "10.00"]);
  expect(screen.getByRole("img", { name: "Mu legend" })).toBeInTheDocument();
  const stops = screen.getAllByTestId("gltf-legend-stop");
  expect(stops.length).toBeGreaterThan(2);
  expect(stops[0].getAttribute("stop-color")).toBe("rgb(68, 1, 84)");
  expect(stops[stops.length - 1].getAttribute("stop-color")).toBe("rgb(253, 231, 37)");
  expect(screen.queryByTestId("gltf-legend-note")).not.toBeInTheDocument();
});

it("labels a zero range like the server legend", () => {
  render(<GltfLegend rampName="turbo" min={3} max={3} />);
  expect(screen.getAllByTestId("gltf-legend-tick").map((el) => el.textContent)).toEqual([
    "3.00", "3.25", "3.50", "3.75", "4.00",
  ]);
});

it("shows the bar without labels and a note when the dataset has no value range", () => {
  render(<GltfLegend rampName="turbo" />);
  expect(screen.queryAllByTestId("gltf-legend-tick")).toHaveLength(0);
  expect(screen.getByTestId("gltf-legend-note")).toHaveTextContent("Value range unavailable");
  expect(screen.getAllByTestId("gltf-legend-stop").length).toBeGreaterThan(2);
});

it("shows the variable title above the bar when given", () => {
  render(<GltfLegend rampName="viridis" min={0} max={100} title="Root-zone soil moisture (% saturation)" />);
  expect(screen.getByTestId("gltf-legend-title")).toHaveTextContent("Root-zone soil moisture (% saturation)");
  expect(screen.getByRole("img", { name: "Root-zone soil moisture (% saturation) legend" })).toBeInTheDocument();
  expect(screen.getAllByTestId("gltf-legend-tick").map((el) => el.textContent)).toEqual([
    "0.00", "25.00", "50.00", "75.00", "100.00",
  ]);
});
