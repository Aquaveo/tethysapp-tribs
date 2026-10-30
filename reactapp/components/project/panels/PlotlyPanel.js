import PropTypes from "prop-types"
import { useContext, useEffect, useState } from "react";
import Plot from "react-plotly.js";
import styled from "styled-components";

import { datasetPropTypes } from "components/tree/propTypes";
import SlideSheet from "components/dialogs/SlideSheet"
import { AppContext, GraphicsWindowVisualsContext, SidePanelContext } from "react-tethys/context";
import Select from "react-select";
import { VARIABLE_SEPARATOR } from "constants/PlotConstants";
import { Button } from "react-bootstrap";
import { DO_NOT_SET_LAYER } from "constants/GraphicsWindowConstants";
import { describeLayer, variableTitle, variableLabel, variableUnits } from "lib/outputVariables";

const DEFAULT_PLOT_LAYOUT = {
  title: 'Time series',
  showlegend: true,
  yaxis: {
    type: "linear",
    autorange: true,
    title: {
      text: "Value",
      font: { size: 18 }
    }
  },
  xaxis: {
    title: { text: "Time", font: { size: 18 }},
    type: "date",
    tickformat: ' %H:%M\n%b %d, %Y'
  },
};

/**
 * Plot title and y-axis text for a series: the friendly label and display units the backend sends with the
 * timeseries, falling back to the layer name (and its header unit token) for older or uncovered variables.
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
  return { label, units, title: variableTitle(variable), yAxis: units ?? label };
}

const DEFAULT_PLOT_CONFIG = { responsive: true, displayModeBar: true };

const StyledPlot = styled(Plot)`
  height: 100%;
  .active {
    display: unset;
  };
`;

const CustomHeader = styled.div`
  width: calc(100% + 40px);
  display: grid;
  grid-template-columns: 1fr;
  align-items: center;
`;

const OptionsWindow = styled.div`
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
  ...props
}) => {
  const { backend } = useContext(AppContext);
  const { hideSidePanel, visibleSidePanel, showPanel } = useContext(SidePanelContext);
  const { visibleCZMLObject, selectedCZMLPoint, startDates } = useContext(GraphicsWindowVisualsContext);
  const handleClose = () => {
    hideSidePanel(panelId);
  }
  const [currentData, setCurrentData] = useState(null);
  const [plotLayout, setPlotLayout] = useState(layout);
  // eslint-disable-next-line no-unused-vars
  const [plotConfig, setPlotConfig] = useState(config);

  useEffect(() => {
    const datasetIdMatch = selectedCZMLPoint?.match(/\[(.*?)\]/);
    const datasetId = datasetIdMatch ? datasetIdMatch[1] : null;
    if (datasetId === dataset.id) {
      const datasetId = selectedCZMLPoint.match(/\[(.*?)\]/)[1]; // This grabs any string inbetween brackets "[" or "]"
      const variableName = visibleCZMLObject?.[datasetId];
      const applyTitles = (plotData = {}) => {
        const titles = seriesTitles(dataset, variableName, plotData);
        setPlotLayout((prevData) => ({
          ...prevData,
          title: titles.title,
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
        title: titles.title,
        yaxis: { ...prevData.yaxis, title: { ...prevData.yaxis.title, text: titles.yAxis } },
      }));
    }
  };

  backend.on(backend.actions.DATASET_GET_PIXEL_TIMESERIES, handleTimeseries);
  backend.on(backend.actions.DATASET_GET_MRF_OR_RFT_TIMESERIES, handleTimeseries);

  const yAxisScaleOptions = [
    { value: "linear", label: "Linear" },
    { value: "log", label: "Log" },
    { value: "-", label: "Auto" },
  ];

  const handleYAxisScaleChange = (selectedOption) => {
    setPlotLayout((prevData) => ({
      ...prevData,
      yaxis: { ...prevData.yaxis, type: selectedOption.value },
    }));
  };

  const handleShowProperties = () => {
    const visPanelId = `slide-panel-${dataset.id}`;
    if (visibleSidePanel.includes(visPanelId)) {
      hideSidePanel(visPanelId);
    } else {
      showPanel(visPanelId);
    }
  };

  const SlideSheetTitle = (
    <CustomHeader>
      <div>
        {`${visibleCZMLObject?.[dataset.id] ? seriesTitles(dataset, visibleCZMLObject[dataset.id]).title : "Empty"} Plot`}
      </div>
    </CustomHeader>
  );

  return (
    <SlideSheet
      title={SlideSheetTitle}
      show={visibleSidePanel.includes(panelId)}
      placement={placement}
      onClose={handleClose}
      {...props}
    >
      <div style={{ display: "grid", gridTemplateColumns: "7fr 1fr", height: "100%" }}>
        <StyledPlot
          data={currentData ? [currentData] : []}
          layout={plotLayout}
          config={plotConfig}
        />
        <OptionsWindow>
          <div className="mt-2">Y Axis Scale</div>
          <Select
            id="y-axis-scale-selector"
            defaultValue={yAxisScaleOptions[0]}
            options={yAxisScaleOptions}
            size={2}
            isSearchable
            onChange={handleYAxisScaleChange}
            isDisabled={false} // TODO detect if there are negative numbers to disable log?
            styles={{
              control: (styles, { isDisabled }) => ({
                ...styles,
                borderColor: isDisabled ? "rgb(206, 212, 218)" : "hsl(0, 0%, 80%)",
              }),
              valueContainer: (styles, { isDisabled }) => ({
                ...styles,
                backgroundColor: isDisabled ? "#e9ecef" : "default",
                lineHeight: .875
              }),
              singleValue: (styles, { isDisabled }) => ({
                ...styles,
                color: isDisabled ? "#212529" : "default",
              }),
              multiValue: (styles, { isDisabled }) => ({
                ...styles,
                color: isDisabled ? "#212529" : "default",
              }),
              indicatorsContainer: (styles, { isDisabled }) => ({
                ...styles,
                backgroundColor: isDisabled ? "#e9ecef" : "default",
              }),
              dropdownIndicator: (styles, { isDisabled }) => ({
                ...styles,
                color: isDisabled ? "#212529" : "default",
              }),
              menu: (styles) => ({
                ...styles,
                lineHeight: .875
              })
            }}
          />
          <Button
            className="mt-2"
            onClick={handleShowProperties}
          >
            {visibleSidePanel.includes(`slide-panel-${dataset.id}`) ? "Close" : "Open"} Visibility Panel
          </Button>
        </OptionsWindow>
      </div>
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
  config: PropTypes.object
};

PlotlyPanel.defaultProps = {
  placement: "bottom",
  layout: DEFAULT_PLOT_LAYOUT,
  config: DEFAULT_PLOT_CONFIG,
}

export default PlotlyPanel;
