import styled from "styled-components";
import PropTypes from "prop-types";
import { BsInfoCircle } from "react-icons/bs";
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { Button } from "react-bootstrap";

const TopOverlayTrigger = styled(OverlayTrigger)`
  z-index: 9999;
`;

const TOOLTIP_BG = "#000";

/** The app's tooltip: white text on black, used by the form info icons and the panel header buttons. */
export const StyledTooltip = styled(Tooltip)`
  & .tooltip-inner {
    color: #fff;
    background-color: ${TOOLTIP_BG};
  }

  /* the arrow is drawn with a different border side per placement */
  &.bs-tooltip-top .tooltip-arrow::before,
  &[data-popper-placement^="top"] .tooltip-arrow::before {
    border-top-color: ${TOOLTIP_BG};
  }
  &.bs-tooltip-bottom .tooltip-arrow::before,
  &[data-popper-placement^="bottom"] .tooltip-arrow::before {
    border-bottom-color: ${TOOLTIP_BG};
  }
  &.bs-tooltip-start .tooltip-arrow::before,
  &[data-popper-placement^="left"] .tooltip-arrow::before {
    border-left-color: ${TOOLTIP_BG};
  }
  &.bs-tooltip-end .tooltip-arrow::before,
  &[data-popper-placement^="right"] .tooltip-arrow::before {
    border-right-color: ${TOOLTIP_BG};
  }
`;

const EmptyButton = styled(Button)`
  display: flex;
  align-items: center;
  color: #212529;
  background-color: unset !important;
  border: none !important;
  outline: none !important;
  &:hover {
    color: #212529 !important;
    outline: none !important;
    outline-offset: none !important;
  }
  &:focus {
    color: #212529 !important;
    box-shadow: none !important;
  }
`;

const ToolTip = ({message, keyName}) => {
  return (
    <TopOverlayTrigger
      key={`tooltip-overlay-${keyName}`}
      aria-label={`tooltip-overlay-${keyName}`}
      placement="top"
      overlay={
        <StyledTooltip id={`tooltip-${keyName}`}>
          {message}
        </StyledTooltip>
      }
    >
      <EmptyButton size="sm" label={`tooltip-button-${keyName}`}>
        <BsInfoCircle />
      </EmptyButton>
    </TopOverlayTrigger>
  );
}

ToolTip.propTypes = {
  message: PropTypes.string,
  keyName: PropTypes.string
};

export default ToolTip;