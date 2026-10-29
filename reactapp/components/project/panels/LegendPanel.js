import PropTypes from "prop-types";
import Select from "react-select";
import SlideSheet from "components/dialogs/SlideSheet";
import GltfLegend from "components/project/panels/GltfLegend";
import { datasetPropTypes } from "components/tree/propTypes";
import { DATASET_VIZ_TYPES } from "constants/GraphicsWindowConstants";
import { useContext } from "react";
import { GraphicsWindowVisualsContext, SidePanelContext } from "react-tethys/context";
import { isDefaultRamp, rampOptions, rampStops, resolveRampName } from "lib/colorRamps";
import { formatTimestepTime } from "lib/meshTimeSeries";

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

const LegendPanel = ({
  title = "Legend",
  placement = "end",
  panelId,
  dataset,
  uniqueId,
  legendUrls,
  subtitle,
  variable,
  onColorRampChange,
  ...props
}) => {
  const TETHYS_MEDIA_URL = process.env.TETHYS_MEDIA_URL;
  const { hideSidePanel, visibleSidePanel } = useContext(SidePanelContext);
  const { colorRamps, setColorRamp } = useContext(GraphicsWindowVisualsContext);

  // glTF meshes can be recolored in the browser with a user-selected ramp (see lib/colorRamps). The default ramp
  // keeps the legend image drawn with the files; any other ramp draws its own legend from the variable's range.
  const isGltf = dataset?.viz?.type === DATASET_VIZ_TYPES.GLTF;
  const rampName = isGltf ? resolveRampName(dataset, colorRamps) : null;
  const drawsOwnLegend = isGltf && !isDefaultRamp(rampName);

  const handleRampChange = (option) => {
    setColorRamp?.(dataset.id, option.value); // applied to the mesh right away
    onColorRampChange?.(option.value); // saved on the dataset
  };

  let slideSheetTitle = title;
  // legendUrls (e.g. the legend of the current time step of a glTF mesh variable) overrides the lookup by name
  const all_legend_urls = dataset.viz.legend ?? [];
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

  if (
    dataset?.viz?.type === DATASET_VIZ_TYPES.CZML
  ) {
    const uniqueName = uniqueId ? uniqueId.replace("_[]", "").split('_').slice(1).join("") : null;
    slideSheetTitle = `${uniqueName} ${title}`;
  } else if (dataset?.viz?.type === DATASET_VIZ_TYPES.WMS_COMPOUND) {
    const uniqueName = uniqueId ? uniqueId.split('_').slice(1).join("") : null;
    slideSheetTitle = `${uniqueName} ${title}`;
  } else if (dataset?.viz?.type === DATASET_VIZ_TYPES.GLTF && uniqueId) {
    slideSheetTitle = `${dataset.name} ${uniqueId} ${title}`;
  } else {
    slideSheetTitle = `${dataset.name} ${title}`
  }
  const subtitleText = subtitle ? formatTimestepTime(subtitle) ?? subtitle : null;

  const handleClose = () => {
    hideSidePanel(panelId);
  };

  return (
    <SlideSheet
      title={slideSheetTitle}
      show={visibleSidePanel.includes(panelId)}
      placement={placement}
      onClose={handleClose}
      style={{ height: "fit-content" }}
    >
      <div>
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
        {subtitleText && (
          <div data-testid="legend-subtitle" style={{ fontSize: "0.85em", marginBottom: "0.25rem" }}>
            {subtitleText} UTC
          </div>
        )}
        {drawsOwnLegend && (
          <GltfLegend rampName={rampName} min={variable?.min} max={variable?.max} variableName={variable?.name} />
        )}
        {!drawsOwnLegend && legend_urls.map((legend_url, i) => {
          let final_url = legend_url;
          if (legend_url.includes("geoserver/wms")) {
            const layerName = legend_url.split("LAYER=")[1].replace(`${dataset.id}_`, "");
            let env_str = dataset.viz?.env_str ? dataset.viz?.env_str : null;
            if (env_str?.[layerName]) {
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
              alt={`${uniqueId} ${title}`}
              src={`${final_url}`}
              style={{ maxWidth: "100%" }}
            />
          );
        })}
      </div>
    </SlideSheet>
  );
};

LegendPanel.propTypes = {
  title: PropTypes.string,
  placement: PropTypes.oneOf(["start", "end", "top", "bottom"]),
  uniqueId: PropTypes.string,
  panelId: PropTypes.string.isRequired,
  dataset: datasetPropTypes.isRequired,
  legendUrls: PropTypes.arrayOf(PropTypes.string),
  subtitle: PropTypes.string,
  // glTF meshes: the variable shown (for its min/max) and the callback that saves a chosen color ramp
  variable: PropTypes.shape({
    name: PropTypes.string,
    min: PropTypes.number,
    max: PropTypes.number,
  }),
  onColorRampChange: PropTypes.func,
};

export default LegendPanel;
