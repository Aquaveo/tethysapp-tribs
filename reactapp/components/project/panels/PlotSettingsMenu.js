import PropTypes from "prop-types";
import React, { useState } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import { BsCheck, BsChevronLeft, BsGear } from "react-icons/bs";

import MinimalDropdownToggle from "components/buttons/MinimalDropdownToggle";

export const Y_AXIS_SCALE_OPTIONS = [
  { value: "linear", label: "Linear" },
  { value: "log", label: "Log" },
  { value: "-", label: "Auto" },
];

/**
 * A menu entry that opens a submenu: looks like the other items, with a chevron on the side it opens to. Sets its
 * own classes so Bootstrap's "dropdown-toggle" caret is not drawn as well.
 */
const SubmenuToggle = React.forwardRef(({ onClick, children, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    onClick={(evt) => {
      evt.preventDefault();
      onClick(evt);
    }}
    {...props}
    className="dropdown-item d-flex align-items-center gap-2"
  >
    <BsChevronLeft aria-hidden size="0.75em" />
    {children}
  </button>
));
SubmenuToggle.displayName = "SubmenuToggle";
SubmenuToggle.propTypes = { onClick: PropTypes.func, children: PropTypes.node };

/**
 * The plot sheet's settings menu (gear in the header): "Y Axis Scale: <current>" opens a submenu listing the
 * scales with the current one checked, and a second entry opens or closes the dataset's Variables panel. The outer
 * menu only closes from outside clicks or a choice, so opening the submenu does not dismiss it. The submenu opens
 * towards the start (left), over the plot, since the gear sits at the right edge of the sheet. Its items exist
 * only while it is open: react-bootstrap keeps a shown menu mounted, and hidden items would still be part of the
 * outer menu's arrow-key order. Known deviation from the ARIA menu pattern: Escape closes both menus.
 */
const PlotSettingsMenu = ({ yAxisScale, onYAxisScaleChange, variablesPanelOpen, onToggleVariablesPanel }) => {
  const [open, setOpen] = useState(false);
  const [scaleOpen, setScaleOpen] = useState(false);
  const current = Y_AXIS_SCALE_OPTIONS.find((option) => option.value === yAxisScale) ?? Y_AXIS_SCALE_OPTIONS[0];

  const closeAll = () => {
    setScaleOpen(false);
    setOpen(false);
  };

  const chooseScale = (value) => {
    onYAxisScaleChange(value);
    closeAll();
  };

  return (
    <Dropdown
      show={open}
      onToggle={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setScaleOpen(false);
        }
      }}
      autoClose="outside"
      align="end"
    >
      <Dropdown.Toggle as={MinimalDropdownToggle} title="Plot settings" aria-label="Plot settings">
        <BsGear />
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown drop="start" show={scaleOpen} onToggle={setScaleOpen}>
          <Dropdown.Toggle as={SubmenuToggle}>Y Axis Scale: {current.label}</Dropdown.Toggle>
          <Dropdown.Menu role="menu">{/* named after its toggle by react-bootstrap */}
            {scaleOpen && Y_AXIS_SCALE_OPTIONS.map((option) => {
              const selected = option.value === current.value;
              return (
                <Dropdown.Item
                  key={option.value}
                  as="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  className="d-flex align-items-center gap-2"
                  onClick={() => chooseScale(option.value)}
                >
                  <BsCheck aria-hidden style={{ visibility: selected ? "visible" : "hidden" }} />
                  {option.label}
                </Dropdown.Item>
              );
            })}
          </Dropdown.Menu>
        </Dropdown>
        <Dropdown.Divider />
        <Dropdown.Item
          as="button"
          onClick={() => {
            onToggleVariablesPanel();
            closeAll();
          }}
        >
          {variablesPanelOpen ? "Close" : "Open"} Variables Panel
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

PlotSettingsMenu.propTypes = {
  yAxisScale: PropTypes.oneOf(Y_AXIS_SCALE_OPTIONS.map((option) => option.value)).isRequired,
  onYAxisScaleChange: PropTypes.func.isRequired, // called with the chosen Plotly axis type ("linear", "log", "-")
  variablesPanelOpen: PropTypes.bool,
  onToggleVariablesPanel: PropTypes.func.isRequired,
};

export default PlotSettingsMenu;
