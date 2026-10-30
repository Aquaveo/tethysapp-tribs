import PropTypes from "prop-types";
import { useId } from "react";

import { legendTicks, rampStops } from "lib/colorRamps";

const BAR_X = 10;
const BAR_WIDTH = 300;

/**
 * Legend for a glTF mesh variable drawn with a user-selected color ramp (see lib/colorRamps): a gradient bar of
 * the ramp labelled from the variable's minimum to its maximum, like the server-drawn PNG of the default ramp.
 * Datasets generated before the value range was recorded get the bar without labels and a note.
 */
const GltfLegend = ({ rampName, min, max, variableName, title }) => {
  const gradientId = `gltf-legend-gradient-${useId().replace(/:/g, "")}`;
  const ticks = legendTicks(min, max);
  const anchor = (i) => (i === 0 ? "start" : i === ticks.length - 1 ? "end" : "middle");

  return (
    <div data-testid="gltf-legend">
      {title && (
        <div data-testid="gltf-legend-title" style={{ fontSize: "0.9em", fontWeight: 600, marginBottom: "0.25rem" }}>
          {title}
        </div>
      )}
      <svg viewBox="0 0 320 60" style={{ width: "100%", maxWidth: "400px" }} role="img" aria-label={`${title ?? variableName ?? ""} legend`}>
        <defs>
          <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
            {rampStops(rampName).map(({ offset, color }) => (
              <stop key={offset} offset={offset} stopColor={color} data-testid="gltf-legend-stop" />
            ))}
          </linearGradient>
        </defs>
        <rect x={BAR_X} y="5" width={BAR_WIDTH} height="25" fill={`url(#${gradientId})`} stroke="#999" strokeWidth="0.5" />
        {ticks.map((value, i) => (
          <text
            key={i}
            x={BAR_X + (BAR_WIDTH * i) / (ticks.length - 1)}
            y="48"
            textAnchor={anchor(i)}
            fontSize="11"
            data-testid="gltf-legend-tick"
          >
            {value.toFixed(2)}
          </text>
        ))}
      </svg>
      {ticks.length === 0 && (
        <div data-testid="gltf-legend-note" style={{ fontSize: "0.85em", color: "#666" }}>
          Value range unavailable for this ramp. Regenerate the visualization to label the legend.
        </div>
      )}
    </div>
  );
};

GltfLegend.propTypes = {
  rampName: PropTypes.string.isRequired,
  min: PropTypes.number,
  max: PropTypes.number,
  variableName: PropTypes.string,
  title: PropTypes.string, // "Root-zone soil moisture (% saturation)"
};

export default GltfLegend;
