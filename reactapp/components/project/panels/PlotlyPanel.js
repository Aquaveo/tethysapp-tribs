import PropTypes from "prop-types"
import { useContext, useEffect, useState } from "react";
import Plot from "react-plotly.js";
import styled from "styled-components";

import { datasetPropTypes } from "components/tree/propTypes";
import SlideSheet from "components/dialogs/SlideSheet"
import PlotSettingsMenu from "components/project/panels/PlotSettingsMenu";
import { AppContext, GraphicsWindowVisualsContext, SidePanelContext } from "react-tethys/context";
import { PLOT_SHEET_HEIGHT_FRACTION, VARIABLE_SEPARATOR, isSelectionOf, selectionDatasetId } from "constants/PlotConstants";
import { DO_NOT_SET_LAYER } from "constants/GraphicsWindowConstants";
import { describeLayer, variableTitle, variableLabel, variableUnits } from "lib/outputVariables";

// The plot fills the bottom half of the window (see PLOT_SHEET_STYLE), so the margins are kept tight: the bottom
// one still fits the two-line date ticks and the axis title. There is no plot title: the sheet header names the
// variable and the y axis carries its units. The legend (shown only for several series, see showLegend) runs
// along the bottom edge of the plot area, under the x axis.
const DEFAULT_PLOT_LAYOUT = {
  autosize: true,
  legend: { orientation: "h", yref: "container", yanchor: "bottom", y: 0, x: 0.5, xanchor: "center" },
  margin: { t: 40, r: 20, b: 70, l: 70 },
  yaxis: {
    type: "linear",
    autorange: true,
    automargin: true,
    title: {
      text: "Value",
      font: { size: 16 }
    }
  },
  xaxis: {
    title: { text: "Time", font: { size: 16 }},
    type: "date",
    tickformat: ' %H:%M\n%b %d, %Y',
    automargin: true,
  },
};

// Docked to the bottom of the page: the sheet's top edge sits at the vertical midpoint of the window so the map
// stays visible above it. The bottom margin keeps it clear of the Cesium timeline (the SlideSheet default).
const PLOT_SHEET_MARGIN_BOTTOM = "60px";
const PLOT_SHEET_STYLE = {
  height: `calc(${PLOT_SHEET_HEIGHT_FRACTION * 100}vh - ${PLOT_SHEET_MARGIN_BOTTOM})`,
  marginBottom: PLOT_SHEET_MARGIN_BOTTOM,
};

/** A legend only helps tell several series apart; a single series is already named by the sheet header. */
export const showLegend = (data) => data.length > 1;

/**
 * Titles for a series: the friendly label (the sheet header), its display units, and the two together
 * ("Depth to Groundwater (m)") for the y axis, from what the backend sends with the timeseries, falling back to the
 * layer name (and its header unit token) for older or uncovered variables.
 */
export function seriesTitles(dataset, layerName, plotData = {}) {
  const fallback = describeLayer(dataset, layerName);
  const variable = {
    name: layerName,
    label: plotData.label ?? fallback.label,
    units: plotData.units !== undefined ? plotData.units : fallback.units,
  };
  const label = variableLabel(variable);
  const units = variableUnits(variable);
  const title = variableTitle(variable);
  return { label, units, title, yAxis: title };
}

const DEFAULT_PLOT_CONFIG = { responsive: true, displayModeBar: true };

const StyledPlot = styled(Plot)`
  height: 100%;
  .active {
    display: unset;
  };
  /* Plotly anchors its toolbar to the top-right corner; it sits at the top-left here, with its tooltips
     opening to the right so the first ones are not cut off by the sheet's edge. The selectors repeat Plotly's
     own (".js-plotly-plot .plotly ...") so they outrank the rules it injects. */
  &.js-plotly-plot .plotly .modebar {
    left: 2px;
    right: auto;
    width: max-content; /* keep one row: anchored left, it would otherwise shrink-wrap and stack its groups */
  }
  &.js-plotly-plot .plotly .modebar [data-title]:before,
  &.js-plotly-plot .plotly .modebar [data-title]:after {
    right: auto;
    left: 50%;
  }
  &.js-plotly-plot .plotly .modebar [data-title]:before {
    margin-right: 0;
    margin-left: -6px;
  }
  &.js-plotly-plot .plotly .modebar [data-title]:after {
    margin-right: 0;
    margin-left: -18px;
  }
`;

// I'm going to keep this here for now in case we ever get the dynamic date/hour switching working
// eslint-disable-next-line no-unused-vars
function hoursFromDates(startDate, endDate) {
  const timeDifference = new Date(endDate).getTime() - startDate.getTime();
  const hoursDifference = timeDifference / (60 * 60 * 1000);
  return hoursDifference;
}

function hoursToDateConverter(date, h) {
  const hoursAdded = h*60*60*1000
  const previousDate = new Date(date);
  const newDate = new Date(previousDate.setTime(date.getTime() + (hoursAdded)));
  // Extract year, month, and day
  const year = newDate.getFullYear();
  const month = String(newDate.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(newDate.getDate()).padStart(2, '0');

  // Construct the date string in "yyyy-mm-dd" format
  const dateString = `${year}-${month}-${day}`;
  const timeOptions = {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  };

  const timeString = newDate.toLocaleTimeString("en-US", timeOptions);
  return `${dateString} ${timeString}`;
}

const PlotlyPanel = ({
  placement = "bottom",
  layout,
  config,
  panelId,
  dataset,
  realizationIndex,
  style,
  ...props
}) => {
  const { backend } = useContext(AppContext);
  const { hideSidePanel, visibleSidePanel, showPanel } = useContext(SidePanelContext);
  const { visibleCZMLObject, selectedCZMLPoint, setSelectedCZMLPoint, startDates } = useContext(GraphicsWindowVisualsContext);
  const handleClose = () => {
    hideSidePanel(panelId);
    if (isSelectionOf(selectedCZMLPoint, dataset.id)) {
      setSelectedCZMLPoint?.(null); // the globe's selection follows (see graphics-window/SelectionFocus)
    }
  }
  const [currentData, setCurrentData] = useState(null);
  const [plotLayout, setPlotLayout] = useState(layout);
  const yAxisScale = plotLayout.yaxis?.type ?? "linear"; // what the settings menu shows as current
  // eslint-disable-next-line no-unused-vars
  const [plotConfig, setPlotConfig] = useState(config);

  useEffect(() => {
    const datasetId = selectionDatasetId(selectedCZMLPoint);
    if (datasetId === dataset.id) {
      const variableName = visibleCZMLObject?.[datasetId];
      const applyTitles = (plotData = {}) => {
        const titles = seriesTitles(dataset, variableName, plotData);
        setPlotLayout((prevData) => ({
          ...prevData,
          yaxis: {
            ...prevData.yaxis,
            title: {
              ...prevData.yaxis.title,
              text: titles.yAxis,
            },
          },
        }));
      };
      if (variableName !== DO_NOT_SET_LAYER && selectedCZMLPoint.includes("point") && variableName) {
        const pointId = selectedCZMLPoint.split(" [")[0].split(VARIABLE_SEPARATOR)[1];
        backend.do(
          backend.actions.DATASET_GET_PIXEL_TIMESERIES,
          {id: datasetId, point_id: pointId, variable: variableName}
        );
        applyTitles();
      } else if (variableName !== DO_NOT_SET_LAYER && selectedCZMLPoint.includes("polygon") && variableName) {
        backend.do(
          backend.actions.DATASET_GET_MRF_OR_RFT_TIMESERIES,
          {id: datasetId, variable: variableName}
        );
        applyTitles();
      }
    }
  }, [backend, dataset, selectedCZMLPoint, visibleCZMLObject]);

  // The series arrives with its values already in display units and how to label it (label, units); older
  // backends send only x and y, in which case the titles derived from the layer name stay.
  const handleTimeseries = (plotData) => {
    const startDate = startDates[realizationIndex];
    const timeConverted = plotData.x.map(
      (timeInHours) => hoursToDateConverter(startDate, timeInHours)
    )
    const layerName = plotData.name ?? visibleCZMLObject?.[dataset.id];
    const titles = seriesTitles(dataset, layerName, plotData);
    setCurrentData({
      x: timeConverted,
      y: plotData.y,
      name: titles.label,
      type: "scatter",
      mode: "lines+markers",
      marker: {color: 'red'},
    });
    if (plotData.label !== undefined || plotData.units !== undefined) {
      setPlotLayout((prevData) => ({
        ...prevData,
        yaxis: { ...prevData.yaxis, title: { ...prevData.yaxis.title, text: titles.yAxis } },
      }));
    }
  };

  backend.on(backend.actions.DATASET_GET_PIXEL_TIMESERIES, handleTimeseries);
  backend.on(backend.actions.DATASET_GET_MRF_OR_RFT_TIMESERIES, handleTimeseries);

  const handleYAxisScaleChange = (scale) => {
    setPlotLayout((prevData) => ({
      ...prevData,
      yaxis: { ...prevData.yaxis, type: scale },
    }));
  };

  const variablesPanelId = `slide-panel-${dataset.id}`;
  const variablesPanelOpen = visibleSidePanel.includes(variablesPanelId);
  const handleToggleVariablesPanel = () => {
    if (variablesPanelOpen) {
      hideSidePanel(variablesPanelId);
    } else {
      showPanel(variablesPanelId);
    }
  };

  const plotData = currentData ? [currentData] : [];
  const title = `${visibleCZMLObject?.[dataset.id] ? seriesTitles(dataset, visibleCZMLObject[dataset.id]).label : "Empty"} Plot`;

  return (
    <SlideSheet
      title={title}
      actions={
        <PlotSettingsMenu
          yAxisScale={yAxisScale}
          onYAxisScaleChange={handleYAxisScaleChange}
          variablesPanelOpen={variablesPanelOpen}
          onToggleVariablesPanel={handleToggleVariablesPanel}
        />
      }
      show={visibleSidePanel.includes(panelId)}
      placement={placement}
      onClose={handleClose}
      style={{ ...PLOT_SHEET_STYLE, ...style }}
      data-plot-sheet="" // lets graphics-window/SelectionFocus measure what the sheet covers
      {...props}
    >
      <StyledPlot
        data={plotData}
        layout={{ ...plotLayout, showlegend: showLegend(plotData) }}
        config={plotConfig}
        // react-plotly's default style is an inline-block div with no width, which Plotly sizes to its 700px
        // default; an explicit full-size block (plus the resize handler) makes the plot track the sheet.
        style={{ position: "relative", width: "100%", height: "100%" }}
        useResizeHandler
      />
    </SlideSheet>
  );
};

PlotlyPanel.propTypes = {
  placement: PropTypes.oneOf(["start", "end", "top", "bottom"]),
  panelId: PropTypes.string.isRequired,
  realizationIndex: PropTypes.number.isRequired,
  dataset: datasetPropTypes.isRequired,

  // Trust me these are as precise as it can be without taking days off your life
  layout: PropTypes.object,
  config: PropTypes.object,
  style: PropTypes.object, // merged over the bottom-half docking style
};

PlotlyPanel.defaultProps = {
  placement: "bottom",
  layout: DEFAULT_PLOT_LAYOUT,
  config: DEFAULT_PLOT_CONFIG,
}

export default PlotlyPanel;
