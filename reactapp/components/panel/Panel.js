import styled from "styled-components";
import Collapse from "react-bootstrap/Collapse";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import { NavLink } from "react-bootstrap";
import PropTypes from "prop-types";
import { useState } from "react";
import {
  BsArrowsAngleContract,
  BsArrowsAngleExpand,
  BsArrowLeft,
} from "react-icons/bs";

import MinimalButton from "components/buttons/MinimalButton";
import { StyledTooltip } from "components/buttons/ToolTips";

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
  const [open, setOpen] = useState(!closed);
  const id = title.toLowerCase().replaceAll(" ", "-");
  // Default to left placement if invalid value given
  const validatedPlacement = VALID_PLACEMENTS.includes(placement)
    ? placement
    : "left";

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
  isProject: PropTypes.bool,
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node),
  ]),
};

export default Panel;
