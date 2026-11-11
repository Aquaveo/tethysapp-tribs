import { useContext } from "react";
import styled from "styled-components";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import { BsFillHouseFill, BsHouseAdd, BsMenuButtonWide } from "react-icons/bs";
import { toast } from "react-toastify";

import MinimalButton from "components/buttons/MinimalButton";
import { StyledTooltip } from "components/buttons/ToolTips";
import Toolbox_Icon from "assets/toolbox-macro.svg";
import Icon from "assets/Icon";
import { HOME } from "constants/GraphicsWindowConstants";
import {
  GraphicsWindowVisualsContext,
  LegendsContext,
  LegendsRegistryContext,
  ModalContext,
} from "react-tethys/context";

// Floats over the map, centered under the navbar, styled like the project panel so the two read as siblings.
const ToolbarWrapper = styled.div`
  position: absolute;
  top: var(--ts-header-height);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem;
  background-color: white;
  border: 1px solid #dedede;
  border-radius: var(--ts-border-radius);
`;

/**
 * The map tools that used to sit in the project panel header: Set Home Extent, Zoom to Home, the global Legends
 * toggle and Open Workflows. Rendered by the project view next to the panel, over the Cesium viewer.
 */
const MapToolbar = () => {
  const { setWorkflowsModal } = useContext(ModalContext);
  const { showLegends } = useContext(LegendsContext);
  const { setShowLegends } = useContext(LegendsRegistryContext);
  const { setUpdateFrame, setZoomToExtent, framedObject } = useContext(GraphicsWindowVisualsContext);

  const handleZoomToHome = () => {
    if (framedObject?.[HOME]) {
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
    <ToolbarWrapper className="map-toolbar shadow-sm" role="toolbar" aria-label="Map tools" data-testid="map-toolbar">
      <OverlayTrigger
        placement="bottom"
        overlay={<StyledTooltip id="map-toolbar-set-home-tooltip">Set Home Extent</StyledTooltip>}
      >
        <MinimalButton size="sm" aria-label="Set Home Extent" onClick={() => setUpdateFrame(true)}>
          <BsHouseAdd fontSize={"1.5em"} />
        </MinimalButton>
      </OverlayTrigger>
      <OverlayTrigger
        placement="bottom"
        overlay={<StyledTooltip id="map-toolbar-zoom-home-tooltip">Zoom to Home</StyledTooltip>}
      >
        <MinimalButton size="sm" aria-label="Zoom to Home" onClick={handleZoomToHome}>
          <BsFillHouseFill fontSize={"1.5em"} />
        </MinimalButton>
      </OverlayTrigger>
      <OverlayTrigger
        placement="bottom"
        overlay={<StyledTooltip id="map-toolbar-legends-tooltip">{showLegends ? "Hide Legends" : "Show Legends"}</StyledTooltip>}
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
        overlay={<StyledTooltip id="map-toolbar-workflows-tooltip">Open Workflows</StyledTooltip>}
      >
        <MinimalButton size="sm" aria-label="Open Workflows" onClick={() => setWorkflowsModal(true)}>
          <Icon src={Toolbox_Icon} altText="" height={"24px"} width="24px" />
        </MinimalButton>
      </OverlayTrigger>
    </ToolbarWrapper>
  );
};

export default MapToolbar;
