import styled from "styled-components";
import PropTypes from "prop-types";
import { BsInfoCircle } from "react-icons/bs";
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { Button } from "react-bootstrap";

const TopOverlayTrigger = styled(OverlayTrigger)`
  z-index: 9999;
`;

const StyledTooltip = styled(Tooltip)`
  & .tooltip-inner {
    color: #fff;
    background-color: #115590;
  }

  & .tooltip-arrow::before {
    color: #fff;
    border-top-color: #115590;
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