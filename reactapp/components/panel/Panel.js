import { useContext } from "react";
import {
  GraphicsWindowVisualsContext,
  LegendsContext,
  LegendsRegistryContext,
  ModalContext,
} from "react-tethys/context";
import { toast } from "react-toastify";

import styled from "styled-components";
import Collapse from "react-bootstrap/Collapse";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import { NavLink } from "react-bootstrap";
import PropTypes from "prop-types";
import { useState } from "react";
import {
  BsArrowsAngleContract,
  BsArrowsAngleExpand,
  BsFillHouseFill,
  BsHouseAdd,
  BsArrowLeft,
  BsMenuButtonWide,
} from "react-icons/bs";

import MinimalButton from "components/buttons/MinimalButton";
import { StyledTooltip } from "components/buttons/ToolTips";
import Toolbox_Icon from "assets/toolbox-macro.svg";
import Icon from "assets/Icon";
import { HOME } from "constants/GraphicsWindowConstants";

const VALID_PLACEMENTS = ["left", "right"];

const PanelWrapper = styled.div`
  position: absolute;
  top: ${(props) => (props.placement === "right" ? "96px" : "56px")};
  ${(props) => (props.placement === "right" ? "right" : "left")}: 10px;
  background-color: white;
  border: 1px solid #dedede;
  border-radius: var(--ts-border-radius);
`;

const PanelHeader = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  min-width: ${(props) => props.width};
  padding: 0.5rem;
  border-top-left-radius: var(--ts-border-radius);
  border-top-right-radius: var(--ts-border-radius);
`;

const PanelHeaderIcons = styled.div``;

const PanelBackButton = styled.div``;

const PanelTitle = styled.h1`
  font-size: 1.25rem;
  margin-bottom: 0;
  line-height: 1.25;
  flex-grow: 1;
`;

const PanelContent = styled.div`
  min-width: ${(props) => props.width};
  height: ${(props) => props.height};
  border-top: 1px solid #dedede;
  padding: 0.5rem;
  overflow: auto;
  border-bottom-left-radius: var(--ts-border-radius);
  border-bottom-right-radius: var(--ts-border-radius);
  resize: horizontal;
  overflow-x: hidden;
`;

const Panel = ({
  title = "Panel",
  width = "250px",
  height = "auto",
  placement = "left",
  closed = false,
  homeURL = "/",
  isProject = false,
  children,
}) => {
  const { setWorkflowsModal } = useContext(ModalContext);
  const { showLegends } = useContext(LegendsContext);
  const { setShowLegends } = useContext(LegendsRegistryContext);
  const { setUpdateFrame, setZoomToExtent, framedObject } = useContext(
    GraphicsWindowVisualsContext
  );
  const [open, setOpen] = useState(!closed);
  const id = title.toLowerCase().replaceAll(" ", "-");
  // Default to left placement if invalid value given
  const validatedPlacement = VALID_PLACEMENTS.includes(placement)
    ? placement
    : "left";

  const handleZoomToHome = () => {
    if (framedObject[HOME]) {
      setZoomToExtent(HOME);
    } else {
      toast.error("Home Extent has not been set yet", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  return (
    <PanelWrapper
      className="panel-wrapper shadow-sm"
      placement={validatedPlacement}
      data-testid="panel-wrapper"
    >
      <PanelHeader className="panel-header" width={width}>
        {isProject && (
          <PanelBackButton className="panel-back-button">
            <NavLink
              style={{padding: "0rem"}}
              href={homeURL}
            >
              <OverlayTrigger
                placement="bottom"
                overlay={<StyledTooltip id="panel-projects-tooltip">Go to Projects List</StyledTooltip>}
              >
                <MinimalButton aria-label="Go to Projects List">
                  <BsArrowLeft color="#21251F" />
                </MinimalButton>
              </OverlayTrigger>
            </NavLink>
          </PanelBackButton>
        )}
        <PanelTitle className="panel-title">{title}</PanelTitle>
        <PanelHeaderIcons className="panel-icons">
          {isProject && (
            <>
              <OverlayTrigger
                placement="bottom"
                overlay={<StyledTooltip id="panel-set-home-tooltip">Set Home Extent</StyledTooltip>}
              >
                <MinimalButton
                  size="sm"
                  aria-label="Set Home Extent"
                  onClick={() => setUpdateFrame(true)}
                >
                  <BsHouseAdd fontSize={"1.5em"} />
                </MinimalButton>
              </OverlayTrigger>
              <OverlayTrigger
                placement="bottom"
                overlay={<StyledTooltip id="panel-zoom-home-tooltip">Zoom to Home</StyledTooltip>}
              >
                <MinimalButton
                  size="sm"
                  aria-label="Zoom to Home"
                  onClick={handleZoomToHome}
                >
                  <BsFillHouseFill fontSize={"1.5em"} />
                </MinimalButton>
              </OverlayTrigger>
              <OverlayTrigger
                placement="bottom"
                overlay={<StyledTooltip id="panel-legends-tooltip">{showLegends ? "Hide Legends" : "Show Legends"}</StyledTooltip>}
              >
                <MinimalButton
                  size="sm"
                  aria-label="Legends"
                  aria-pressed={showLegends}
                  onClick={() => setShowLegends(!showLegends)}
                >
                  <BsMenuButtonWide fontSize={"1.5em"} />
                </MinimalButton>
              </OverlayTrigger>
              <OverlayTrigger
                placement="bottom"
                overlay={<StyledTooltip id="panel-workflows-tooltip">Open Workflows</StyledTooltip>}
              >
                <MinimalButton
                  size="sm"
                  aria-label="Open Workflows"
                  onClick={() => setWorkflowsModal(true)}
                >
                  <Icon
                    src={Toolbox_Icon}
                    altText=""
                    height={"24px"}
                    width="24px"
                  />
                </MinimalButton>
              </OverlayTrigger>
            </>
          )}
          <OverlayTrigger
            placement="bottom"
            overlay={<StyledTooltip id={`${id}-collapse-tooltip`}>{open ? "Shrink" : "Expand"}</StyledTooltip>}
          >
            <MinimalButton
              size="sm"
              aria-label={open ? "Shrink" : "Expand"}
              onClick={() => setOpen(!open)}
              aria-controls={`${id}-panel-content`}
              aria-expanded={open}
            >
              {open ? (
                <BsArrowsAngleContract fontSize={"1.5em"} />
              ) : (
                <BsArrowsAngleExpand fontSize={"1.5em"} />
              )}
            </MinimalButton>
          </OverlayTrigger>
        </PanelHeaderIcons>
      </PanelHeader>
      <Collapse in={open}>
        {/* This div needs to be unstyled to allow for smooth animation when panel opens and closes */}
        <div className="smooth-animation">
          <PanelContent
            id={`${id}-panel-content`}
            className="panel-content"
            width={width}
            height={height}
          >
            {children}
          </PanelContent>
        </div>
      </Collapse>
    </PanelWrapper>
  );
};

Panel.propTypes = {
  title: PropTypes.string,
  homeURL: PropTypes.string,
  width: PropTypes.string,
  height: PropTypes.string,
  placement: PropTypes.oneOf(VALID_PLACEMENTS),
  closed: PropTypes.bool,
  workflowClosed: PropTypes.bool,
  setWorkflowClosed: PropTypes.func,
  isProject: PropTypes.bool,
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node),
  ]),
};

export default Panel;
