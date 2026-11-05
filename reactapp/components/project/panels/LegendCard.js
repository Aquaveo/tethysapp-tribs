import PropTypes from "prop-types";
import { useContext, useId, useState } from "react";
import Collapse from "react-bootstrap/Collapse";
import { BsChevronDown, BsChevronRight } from "react-icons/bs";
import Select from "react-select";

import MinimalButton from "components/buttons/MinimalButton";
import GltfLegend from "components/project/panels/GltfLegend";
import { datasetPropTypes } from "components/tree/propTypes";
import { DATASET_VIZ_TYPES } from "constants/GraphicsWindowConstants";
import { GraphicsWindowVisualsContext } from "react-tethys/context";
import { isDefaultRamp, rampOptions, rampStops, resolveRampName } from "lib/colorRamps";
import { formatTimestepTime } from "lib/meshTimeSeries";
import { describeLayer, isLayerOf, variableLabel, variableUnits } from "lib/outputVariables";

const RAMP_OPTIONS = rampOptions();

/** A select option with a swatch of the ramp's gradient in front of its label. */
const RampOptionLabel = ({ value, label }) => {
  const stops = rampStops(value, 8);
  const background = stops.length
    ? `linear-gradient(to right, ${stops.map((stop) => `${stop.color} ${stop.offset * 100}%`).join(", ")})`
    : "linear-gradient(to right, #1f3b8a, #4f9fd8, #9ad38b, #e9d36a, #ffffff)"; // the baked Topo Atlas ramp
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
      <span
        aria-hidden
        style={{ display: "inline-block", width: "2.5rem", height: "0.9rem", background, border: "1px solid #999" }}
      />
      {label}
    </span>
  );
};

RampOptionLabel.propTypes = {
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
};

/**
 * One layer's legend in the global Legends panel: a collapsible card headed by the realization (if any) and the
 * dataset name, with the variable, the color scale (a glTF ramp selector and browser-drawn scale, or the legend
 * images written with the files), the units and the time step underneath.
 */
const LegendCard = ({
  dataset,
  uniqueId,
  legendUrls,
  subtitle,
  variable,
  realizationName,
  onColorRampChange,
  defaultOpen = true,
}) => {
  const TETHYS_MEDIA_URL = process.env.TETHYS_MEDIA_URL;
  const { colorRamps, setColorRamp } = useContext(GraphicsWindowVisualsContext);
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = `legend-card-body-${useId().replace(/:/g, "")}`;

  // glTF meshes can be recolored in the browser with a user-selected ramp (see lib/colorRamps). The default ramp
  // keeps the legend image drawn with the files; any other ramp draws its own legend from the variable's range.
  const isGltf = dataset?.viz?.type === DATASET_VIZ_TYPES.GLTF;
  const rampName = isGltf ? resolveRampName(dataset, colorRamps) : null;
  const drawsOwnLegend = isGltf && !isDefaultRamp(rampName);

  const handleRampChange = (option) => {
    setColorRamp?.(dataset.id, option.value); // applied to the mesh right away
    onColorRampChange?.(option.value); // saved on the dataset
  };

  // legendUrls (e.g. the legend of the current time step of a glTF mesh variable) overrides the lookup by name
  const all_legend_urls = dataset.viz?.legend ?? [];
  let legend_urls = legendUrls ?? (
    all_legend_urls.length > 1
      ? all_legend_urls.filter((legend_url) => legend_url.includes(uniqueId))
      : all_legend_urls
  );

  if (
    dataset?.viz?.type === DATASET_VIZ_TYPES.CZML ||
    dataset?.viz?.type === DATASET_VIZ_TYPES.GLTF
  ) {
    legend_urls = legend_urls.map((url) => TETHYS_MEDIA_URL + url);
  }

  // The variable the legend is for: the one given, else the dataset layer named by uniqueId (a layer name for
  // CZML output and glTF mesh output, but the dataset id for station data and bare TIN meshes).
  const legendVariable = variable ?? (isLayerOf(dataset, uniqueId) ? describeLayer(dataset, uniqueId) : null);
  let variableName = legendVariable ? variableLabel(legendVariable) : null;
  if (dataset?.viz?.type === DATASET_VIZ_TYPES.WMS_COMPOUND && uniqueId) {
    variableName = uniqueId.split('_').slice(1).join("");
  }
  const unitsText = legendVariable ? variableUnits(legendVariable) : null;
  const subtitleText = subtitle ? formatTimestepTime(subtitle) ?? subtitle : null;

  return (
    <div data-testid="legend-card" style={{ borderBottom: "1px solid #dee2e6", padding: "0.5rem 0" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.25rem" }}>
        <MinimalButton
          size="sm"
          title={open ? "Collapse legend" : "Expand legend"}
          aria-label={`${dataset.name} legend`}
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setOpen(!open)}
        >
          {open ? <BsChevronDown /> : <BsChevronRight />}
        </MinimalButton>
        <div style={{ flex: 1 }}>
          {realizationName && (
            <div data-testid="legend-realization" style={{ fontSize: "0.85em", color: "#555" }}>
              {realizationName}
            </div>
          )}
          <div data-testid="legend-owner" style={{ fontSize: "0.9em", fontWeight: 600 }}>
            {dataset.name}
          </div>
        </div>
      </div>
      <Collapse in={open}>
        <div id={bodyId}>
          <div style={{ paddingLeft: "1.75rem" }}>
            {isGltf && (
              <div className="mb-2">
                <label htmlFor={`color-ramp-${dataset.id}`} style={{ fontSize: "0.85em" }}>Color ramp</label>
                <Select
                  inputId={`color-ramp-${dataset.id}`}
                  aria-label="Color ramp"
                  options={RAMP_OPTIONS}
                  value={RAMP_OPTIONS.find((option) => option.value === rampName)}
                  onChange={handleRampChange}
                  formatOptionLabel={RampOptionLabel}
                  isSearchable={false}
                  menuPortalTarget={typeof document === "undefined" ? null : document.body}
                  styles={{ menuPortal: (base) => ({ ...base, zIndex: 2000 }) }}
                />
              </div>
            )}
            {variableName && (
              <div data-testid="legend-variable" style={{ fontSize: "0.95em", marginBottom: "0.25rem" }}>
                {variableName}
              </div>
            )}
            {drawsOwnLegend && (
              <GltfLegend
                rampName={rampName}
                min={variable?.min}
                max={variable?.max}
                variableName={variable?.name}
              />
            )}
            {!drawsOwnLegend && legend_urls.map((legend_url, i) => {
              let final_url = legend_url;
              if (legend_url.includes("geoserver/wms")) {
                const layerName = legend_url.split("LAYER=")[1]?.replace(`${dataset.id}_`, "");
                let env_str = dataset.viz?.env_str ? dataset.viz?.env_str : null;
                if (layerName && env_str?.[layerName]) {
                  env_str = encodeURIComponent(env_str?.[layerName]);
                  final_url = `${final_url}&ENV=${env_str}`
                } else if (env_str) {
                  env_str = encodeURIComponent(env_str);
                  final_url = `${final_url}&ENV=${env_str}`
                }
              }

              return (
                <img
                  key={`${uniqueId}-${i}`}
                  alt={`${uniqueId} Legend`}
                  src={`${final_url}`}
                  style={{ maxWidth: "100%" }}
                />
              );
            })}
            {unitsText && (
              <div data-testid="legend-units" style={{ fontSize: "0.85em", color: "#555", textAlign: "center" }}>
                {unitsText}
              </div>
            )}
            {subtitleText && (
              <div data-testid="legend-subtitle" style={{ fontSize: "0.85em", color: "#555", marginTop: "0.5rem" }}>
                {subtitleText} UTC
              </div>
            )}
          </div>
        </div>
      </Collapse>
    </div>
  );
};

LegendCard.propTypes = {
  dataset: datasetPropTypes.isRequired,
  uniqueId: PropTypes.string, // the layer / variable name the legend is for (the dataset id for single-layer data)
  legendUrls: PropTypes.arrayOf(PropTypes.string),
  subtitle: PropTypes.string, // ISO time of the glTF time step shown
  realizationName: PropTypes.string, // written on its own line above the dataset name, for realization output
  // glTF meshes: the variable shown (for its label, units and min/max) and the callback that saves a chosen ramp
  variable: PropTypes.shape({
    name: PropTypes.string,
    label: PropTypes.string,
    units: PropTypes.string,
    min: PropTypes.number,
    max: PropTypes.number,
  }),
  onColorRampChange: PropTypes.func,
  defaultOpen: PropTypes.bool,
};

export default LegendCard;
