import PropTypes from "prop-types"
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import Plot from "react-plotly.js";
import styled from "styled-components";

import { datasetPropTypes } from "components/tree/propTypes";
import SlideSheet from "components/dialogs/SlideSheet"
import PlotSettingsMenu from "components/project/panels/PlotSettingsMenu";
import { AppContext, GraphicsWindowVisualsContext, SidePanelContext } from "react-tethys/context";
import { PLOT_SHEET_HEIGHT_FRACTION, VARIABLE_SEPARATOR, isSelectionOf, selectionDatasetId } from "constants/PlotConstants";
import { DO_NOT_SET_LAYER } from "constants/GraphicsWindowConstants";
import { useClockTime } from "lib/clockTime";
import { findValueVariable } from "lib/layerValues";
import { isoToUtcMs } from "lib/meshTimeSeries";
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

/** An axis back on autorange: without the range a zoom or pan left on it (Plotly writes it into the layout). */
function autorangedAxis(axis = {}) {
  // eslint-disable-next-line no-unused-vars
  const { range, ...rest } = axis;
  return { ...rest, autorange: true };
}

/** The layout with both axes framing the whole series again. */
export function reframedLayout(layout) {
  return { ...layout, xaxis: autorangedAxis(layout.xaxis), yaxis: autorangedAxis(layout.yaxis) };
}

const DEFAULT_PLOT_CONFIG = { responsive: true, displayModeBar: true };

// Plotly pads the first toolbar group by 8px and each button by 4px before its icon.
const MODEBAR_ICON_INSET_PX = 12;

/**
 * The left edge of the plot area (where the y axis is drawn) inside a plotted graph div, in px, or null before
 * the first draw. Read from `_fullLayout._size`, the computed size Plotly itself lays the axes out with: it
 * already includes automargin growth for long tick labels and titles.
 */
export function plotAreaLeft(graphDiv) {
  const left = graphDiv?._fullLayout?._size?.l;
  return typeof left === "number" && Number.isFinite(left) ? left : null;
}

const StyledPlot = styled(Plot)`
  height: 100%;
  .active {
    display: unset;
  };
  /* Plotly anchors its toolbar to the top-right corner; it sits at the top-left here, its first icon aligned
     with the y-axis line (--plot-left, set after each draw from Plotly's computed left margin, so long axis
     labels never run into it) and its tooltips opening to the right so the first ones are not cut off by the
     sheet's edge. The selectors repeat Plotly's own (".js-plotly-plot .plotly ...") so they outrank the rules it
     injects. */
  &.js-plotly-plot .plotly .modebar {
    left: calc(var(--plot-left, ${MODEBAR_ICON_INSET_PX}px) - ${MODEBAR_ICON_INSET_PX}px);
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

const MS_PER_HOUR = 60 * 60 * 1000;
// The color of the current-time marker on the timeline (graphics-window/timeline.css)
export const TIME_BAR_COLOR = "#ffc107";
const TIME_BAR_LINE = { color: TIME_BAR_COLOR, width: 3 };

/** The run's start on the map's clock, which reads the run's dates as UTC: the start date's own date and time. */
const runStartOnClock = (startDate) => Date.UTC(
  startDate.getFullYear(), startDate.getMonth(), startDate.getDate(),
  startDate.getHours(), startDate.getMinutes(), startDate.getSeconds()
);

/**
 * The time of the map's clock as a vertical line across the plot (a Plotly layout shape), or null when there is
 * no clock time (no layer drives the clock) or no series.
 *
 * The line is placed by hours since the start of the run, the unit the series arrives in. For a value layer the
 * first row of the variable's values is at `variable.start` on the clock and at `hours[0]` in the series, which
 * ties the two time axes together without assuming how the browser reads the run's start date. Other layers fall
 * back on that start date.
 *
 * Before the first time of the series and after the last the line waits on that time, as the map shows the first
 * and the last row there (the clock may start earlier when another layer drives it, and runs one step past the
 * last row).
 */
export function plotTimeBar({ clockMs, variable, hours, startDate }) {
  if (clockMs === null || clockMs === undefined || !hours?.length || !startDate) return null;
  const firstRowMs = isoToUtcMs(variable?.start ?? null);
  const hoursNow = firstRowMs !== null
    ? hours[0] + (clockMs - firstRowMs) / MS_PER_HOUR
    : (clockMs - runStartOnClock(startDate)) / MS_PER_HOUR;
  const shown = Math.min(Math.max(hoursNow, hours[0]), hours[hours.length - 1]);
  const x = hoursToDateConverter(startDate, shown);
  return { type: "line", xref: "x", yref: "paper", x0: x, x1: x, y0: 0, y1: 1, line: TIME_BAR_LINE };
}

// The backend keeps one handler per action (Backend.on replaces it) and every CZML dataset has a plot sheet, so the
// sheets share one handler that passes a series on to the sheet of the dataset it was read from. A reply without
// a dataset id (an older backend) goes to the sheet that was rendered last, which is the one that asked.
const timeseriesHandlers = new Map(); // dataset id -> handler of that dataset's plot sheet
let lastTimeseriesHandler = null;

function dispatchTimeseries(plotData) {
  const handler =
    plotData?.dataset_id !== undefined ? timeseriesHandlers.get(plotData.dataset_id) : lastTimeseriesHandler;
  handler?.(plotData);
}

/** The id of the selected point ("72" for "point_72 [<dataset id>]"), as it is sent with a pixel series request. */
const selectedPointId = (selection) => selection?.split(" [")[0].split(VARIABLE_SEPARATOR)[1];

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
  const plottedVariableRef = useRef(null); // the variable of the series on the plot
  const [seriesHours, setSeriesHours] = useState(null); // the times of the series, in hours since the run start
  const [plotLayout, setPlotLayout] = useState(layout);
  const yAxisScale = plotLayout.yaxis?.type ?? "linear"; // what the settings menu shows as current

  // Keep the toolbar aligned with the y axis: after each draw, publish the plot area's left edge as a CSS
  // variable on the graph div (see StyledPlot). Same value -> no re-render, so the draw/measure cycle settles.
  const graphDivRef = useRef(null);
  const [plotLeft, setPlotLeft] = useState(null);
  const handleInitialized = useCallback((figure, graphDiv) => {
    graphDivRef.current = graphDiv;
  }, []);
  const handleAfterPlot = useCallback(() => {
    setPlotLeft(plotAreaLeft(graphDivRef.current));
  }, []);
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
        const pointId = selectedPointId(selectedCZMLPoint);
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
    // The reply says what it answers (variable and, for a pixel series, point). Drop one that a newer request has
    // overtaken; an older backend sends neither, and its reply is plotted as before.
    const overtaken =
      (plotData.name !== undefined && plotData.name !== visibleCZMLObject?.[dataset.id]) ||
      (plotData.point_id !== undefined && String(plotData.point_id) !== selectedPointId(selectedCZMLPoint));
    if (overtaken) {
      return;
    }
    const startDate = startDates[realizationIndex];
    const timeConverted = plotData.x.map(
      (timeInHours) => hoursToDateConverter(startDate, timeInHours)
    )
    const layerName = plotData.name ?? visibleCZMLObject?.[dataset.id];
    const titles = seriesTitles(dataset, layerName, plotData);
    setSeriesHours(plotData.x);
    setCurrentData({
      x: timeConverted,
      y: plotData.y,
      name: titles.label,
      type: "scatter",
      mode: "lines", // no markers: an hourly series is thousands of them, hiding the line
      line: { color: "red" },
    });
    // Another variable has another range: frame its whole series, whatever zoom was left from the previous one.
    // Another feature of the same variable keeps the zoom, so features can be compared over the same window.
    const reframe = plottedVariableRef.current !== null && plottedVariableRef.current !== layerName;
    plottedVariableRef.current = layerName;
    const retitle = plotData.label !== undefined || plotData.units !== undefined;
    if (reframe || retitle) {
      setPlotLayout((prevData) => {
        const next = reframe ? reframedLayout(prevData) : prevData;
        if (!retitle) return next;
        return { ...next, yaxis: { ...next.yaxis, title: { ...next.yaxis.title, text: titles.yAxis } } };
      });
    }
  };

  // Registered after every render so the handler sees the current selection and start dates.
  useEffect(() => {
    timeseriesHandlers.set(dataset.id, handleTimeseries);
    lastTimeseriesHandler = handleTimeseries;
    backend.on(backend.actions.DATASET_GET_PIXEL_TIMESERIES, dispatchTimeseries);
    backend.on(backend.actions.DATASET_GET_MRF_OR_RFT_TIMESERIES, dispatchTimeseries);
    return () => {
      if (timeseriesHandlers.get(dataset.id) === handleTimeseries) {
        timeseriesHandlers.delete(dataset.id);
      }
      if (lastTimeseriesHandler === handleTimeseries) {
        lastTimeseriesHandler = null;
      }
    };
  });

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

  // The time shown on the map, as a line on the plot. Only an open sheet follows the clock.
  const shown = visibleSidePanel.includes(panelId);
  const clockMs = useClockTime(shown && currentData !== null);
  const timeBar = plotTimeBar({
    clockMs,
    variable: findValueVariable(dataset, visibleCZMLObject?.[dataset.id]),
    hours: seriesHours,
    startDate: startDates?.[realizationIndex],
  });
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
      show={shown}
      placement={placement}
      onClose={handleClose}
      style={{ ...PLOT_SHEET_STYLE, ...style }}
      data-plot-sheet="" // lets graphics-window/SelectionFocus measure what the sheet covers
      {...props}
    >
      <StyledPlot
        data={plotData}
        layout={{ ...plotLayout, showlegend: showLegend(plotData), shapes: timeBar ? [timeBar] : [] }}
        config={plotConfig}
        // react-plotly's default style is an inline-block div with no width, which Plotly sizes to its 700px
        // default; an explicit full-size block (plus the resize handler) makes the plot track the sheet.
        style={{ position: "relative", width: "100%", height: "100%", "--plot-left": plotLeft === null ? undefined : `${plotLeft}px` }}
        useResizeHandler
        onInitialized={handleInitialized}
        onAfterPlot={handleAfterPlot}
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
