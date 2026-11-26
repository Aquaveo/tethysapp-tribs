import PropTypes from "prop-types";
import { useContext, useId, useMemo, useState } from "react";
import Collapse from "react-bootstrap/Collapse";
import { BsChevronDown, BsChevronRight } from "react-icons/bs";
import Select from "react-select";

import MinimalButton from "components/buttons/MinimalButton";
import GltfLegend from "components/project/panels/GltfLegend";
import { getLayerItems } from "components/project/panels/VariablesPanel";
import { datasetPropTypes } from "components/tree/propTypes";
import { DATASET_VIZ_TYPES } from "constants/GraphicsWindowConstants";
import { GraphicsWindowVisualsContext } from "react-tethys/context";
import useLayerValues from "hooks/useLayerValues";
import { DEFAULT_RAMP, isDefaultRamp, rampOptions, rampStops, resolveRampName } from "lib/colorRamps";
import { featureValue, findValueVariable, hasValues, rowIndexForTime, rowTime } from "lib/layerValues";
import { formatTimestepTime, isTimeDynamic, makeActiveTimeSeries } from "lib/meshTimeSeries";
import { describeLayer, groupByTier, isLayerOf, variableLabel, variableUnits } from "lib/outputVariables";

/** A select option with a swatch of the ramp's gradient in front of its label. */
const RampOptionLabel = ({ value, label }) => {
  const stops = rampStops(value, 8);
  const background = value !== DEFAULT_RAMP
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

/** A value as the legend's own labels write it, with more digits for a small one that would read as 0.00. */
const formatMarkedValue = (value) => (
  value !== 0 && Math.abs(value) < 0.01 ? value.toPrecision(2) : value.toFixed(2)
);

/**
 * One layer's legend in the global Legends panel: a collapsible card headed by the realization (if any) and the
 * dataset name, with the variable, the color scale (a ramp selector and browser-drawn scale for glTF meshes and
 * value layers, or the legend images written with the files), the units and the time step underneath.
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
  const {
    colorRamps, setColorRamp, meshClockTime, selectedCZMLPoint, setCZMLLayer, setActiveTimeSeries,
  } = useContext(GraphicsWindowVisualsContext);
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = `legend-card-body-${useId().replace(/:/g, "")}`;

  // glTF meshes and value layers (node, outlet and basin output, see lib/layerValues) are colored in the browser
  // with a user-selected ramp (see lib/colorRamps). The default glTF ramp keeps the legend image drawn with the
  // files; every other ramp, and every ramp of a value layer, draws its own legend from the variable's range.
  const isGltf = dataset?.viz?.type === DATASET_VIZ_TYPES.GLTF;
  const isValueLayer = hasValues(dataset);
  const picksRamp = isGltf || isValueLayer;
  const rampName = picksRamp ? resolveRampName(dataset, colorRamps) : null;
  const drawsOwnLegend = isValueLayer || (isGltf && !isDefaultRamp(rampName));
  const options = useMemo(() => (picksRamp ? rampOptions(dataset) : []), [picksRamp, dataset]);

  // A value layer shows, of the selected variable, the row of the last time at or before the clock time: the
  // legend names the time of that row.
  const valueVariable = isValueLayer ? findValueVariable(dataset, uniqueId) : null;
  const layerValues = useLayerValues(valueVariable ? TETHYS_MEDIA_URL + valueVariable.values : null);
  const valueRow = layerValues ? rowIndexForTime(layerValues, meshClockTime) : null;
  const valueTime = layerValues ? rowTime(layerValues, valueRow) : null;
  // The value pointed out on the legend: that of the selected feature in the row shown.
  const markedFeature = selectedCZMLPoint;
  const markedValue = layerValues ? featureValue(layerValues, markedFeature, valueRow) : null;
  // Every other feature of the layer (nodes, outlets, or the basin while it is not selected) gets a tick at its
  // value, so the legend shows where they all are in the range at the time shown.
  const otherValues = layerValues
    ? layerValues.ids
      .filter((id) => id !== markedFeature)
      .map((id) => featureValue(layerValues, id, valueRow))
      .filter((value) => value !== null)
    : [];

  // The variables of the layer can be picked here as in the dataset's Variables panel: priority variables first,
  // the secondary ones of a tiered output in a group of their own.
  const variableOptions = useMemo(() => {
    const toOption = (item) => ({ value: item.key, label: item.label, item });
    const { primary, more } = groupByTier(getLayerItems(dataset));
    const options = primary.map(toOption);
    return more.length > 0
      ? [{ label: "Variables", options }, { label: "More variables", options: more.map(toOption) }]
      : options;
  }, [dataset]);
  const flatVariableOptions = variableOptions.flatMap((option) => option.options ?? [option]);
  const selectedVariableOption = flatVariableOptions.find((option) => option.value === uniqueId);
  const picksVariable = flatVariableOptions.length > 1 && Boolean(selectedVariableOption);

  const handleVariableChange = ({ item }) => {
    setCZMLLayer?.(dataset.id, item.key);
    if (item.variable && isTimeDynamic(item.variable)) {
      // The most recently selected time series variable drives the Cesium clock (as in the Variables panel)
      setActiveTimeSeries?.(makeActiveTimeSeries(dataset, item.variable));
    }
  };

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
  const shownTime = subtitle ?? valueTime;
  const subtitleText = shownTime ? formatTimestepTime(shownTime) ?? shownTime : null;

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
            {picksRamp && (
              <div className="mb-2">
                <label htmlFor={`color-ramp-${dataset.id}`} style={{ fontSize: "0.85em" }}>Color ramp</label>
                <Select
                  inputId={`color-ramp-${dataset.id}`}
                  aria-label="Color ramp"
                  options={options}
                  value={options.find((option) => option.value === rampName)}
                  onChange={handleRampChange}
                  formatOptionLabel={RampOptionLabel}
                  isSearchable={false}
                  menuPortalTarget={typeof document === "undefined" ? null : document.body}
                  styles={{ menuPortal: (base) => ({ ...base, zIndex: 2000 }) }}
                />
              </div>
            )}
            {picksVariable && (
              <div className="mb-2" data-testid="legend-variable">
                <label htmlFor={`legend-variable-${dataset.id}`} style={{ fontSize: "0.85em" }}>Variable</label>
                <Select
                  inputId={`legend-variable-${dataset.id}`}
                  aria-label="Variable"
                  options={variableOptions}
                  // shown as the legend names the variable; its units are written under the color scale
                  value={{ ...selectedVariableOption, label: variableName ?? selectedVariableOption.label }}
                  onChange={handleVariableChange}
                  menuPortalTarget={typeof document === "undefined" ? null : document.body}
                  styles={{ menuPortal: (base) => ({ ...base, zIndex: 2000 }) }}
                />
              </div>
            )}
            {!picksVariable && variableName && (
              <div data-testid="legend-variable" style={{ fontSize: "0.95em", marginBottom: "0.25rem" }}>
                {variableName}
              </div>
            )}
            {drawsOwnLegend && (
              <GltfLegend
                rampName={rampName}
                min={legendVariable?.min ?? undefined}
                max={legendVariable?.max ?? undefined}
                variableName={legendVariable?.name}
                marker={markedValue ?? undefined}
                ticks={otherValues}
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
            {markedValue !== null && (
              <div data-testid="legend-marked-value" style={{ fontSize: "0.85em", marginTop: "0.25rem" }}>
                Selected feature: {formatMarkedValue(markedValue)}
                {unitsText ? ` ${unitsText}` : ""}
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
