import { useContext } from "react";
import {
  GraphicsWindowVisualsContext,
  ModalContext,
} from "react-tethys/context";
import { toast } from "react-toastify";

import styled from "styled-components";
import Collapse from "react-bootstrap/Collapse";
import { NavLink } from "react-bootstrap";
import PropTypes from "prop-types";
import { useState } from "react";
import {
  BsArrowsAngleContract,
  BsArrowsAngleExpand,
  BsFillHouseFill,
  BsHouseAdd,
  BsArrowLeft,
} from "react-icons/bs";

import MinimalButton from "components/buttons/MinimalButton";
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
              <MinimalButton
                title="Go to Projects List"
              >
                <BsArrowLeft color="#21251F" />
              </MinimalButton>
            </NavLink>
          </PanelBackButton>
        )}
        <PanelTitle className="panel-title">{title}</PanelTitle>
        <PanelHeaderIcons className="panel-icons">
          {isProject && (
            <>
              <MinimalButton
                size="sm"
                title="Set Home Extent"
                onClick={() => setUpdateFrame(true)}
              >
                <BsHouseAdd fontSize={"1.5em"} />
              </MinimalButton>
              <MinimalButton
                size="sm"
                title="Zoom to Home"
                onClick={handleZoomToHome}
              >
                <BsFillHouseFill fontSize={"1.5em"} />
              </MinimalButton>
              <MinimalButton
                size="sm"
                title="Open Workflows"
                onClick={() => setWorkflowsModal(true)}
              >
                <Icon
                  src={Toolbox_Icon}
                  altText="Open Workflows"
                  height={"24px"}
                  width="24px"
                />
              </MinimalButton>
            </>
          )}
          <MinimalButton
            size="sm"
            title={open ? "Shrink" : "Expand"}
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
