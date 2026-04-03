import styled from "styled-components";
import Offcanvas from "react-bootstrap/Offcanvas";
import PropTypes from "prop-types";

const StyledOffcanvas = styled(Offcanvas)`
  ${(props) =>
    props.placement === "start" && 
    `
      min-width: ${props.style?.width ?? "350px"};
      margin-top: ${props.style?.marginTop ?? "56px"};
      margin-bottom: ${props.style?.marginBottom ?? "120px"};
      margin-left: ${props.style?.marginLeft ?? "10px"};
      max-height: calc(100% - ${
          props.style?.marginTop ?? "56px"
        } - ${
          props.style?.marginBottom ?? "120px"
        }
      );
    `
  };

  ${(props) =>
    props.placement === "end" && 
    `
      min-width: ${props.style?.width ?? "350px"};
      margin-top: ${props.style?.marginTop ?? "56px"};
      margin-bottom: ${props.style?.marginBottom ?? "60px"};
      margin-right: ${props.style?.marginRight ?? "10px"};
      max-height: calc(100% - ${
          props.style?.marginTop ?? "56px"
        } - ${
          props.style?.marginBottom ?? "120px"
        }
      );
    `
  };

  ${(props) =>
    props.placement === "top" && 
    `
      min-width: ${
        props.style?.width ??
        `
          calc(100% - ${
            props.style?.marginLeft ?? '370px'
          } - ${
            props.style?.marginRight ?? '10px'
          } - 360px)
        `
      };
      margin-top: ${props.style?.marginTop ?? "56px"};
      margin-left: ${props.style?.marginLeft ?? "370px"};
      margin-right ${props.style?.marginRight ?? "10px"};
    `
  };

  ${(props) =>
    props.placement === "bottom" && 
    `
      min-width: ${
        props.style?.width ??
        `
          calc(100% - ${
            props.style?.marginLeft ?? '370px'
          } - ${
            props.style?.marginRight ?? '10px'
          } - 360px)
        `
      };
      margin-bottom: ${props.style?.marginBottom ?? "60px"};
      margin-left: ${props.style?.marginLeft ?? "370px"};
      margin-right ${props.style?.marginRight ?? "10px"};
    `
  };
  width: min-content;
  height: ${(props) => props.style?.height ?? props.style?.height}
  z-index: 1025;
  border: 1px solid #dedede;
  border-radius: var(--ts-border-radius);
`;

const StyledOffCanvasHeader = styled(Offcanvas.Header)`
  padding: 0.5rem;

  & .btn-close {
    margin-right: 0;
  }
`;

const StyledOffCanvasBody = styled(Offcanvas.Body)`
  padding: 0.5rem;
  border-top: 1px solid #dedede;
  ${(props) => props.style?.resize && 
    `resize: horizontal;`
  }
  ${(props) =>
    props.placement === "start" && 
    `min-width: ${props.style?.width ?? "350px"};`
  };

  ${(props) =>
    props.placement === "end" && 
    `min-width: ${props.style?.width ?? "350px"};`
  };

  ${(props) =>
    props.placement === "top" && 
    `
      min-width: ${
        props.style?.width ??
        `
          calc(100% - ${
            props.style?.marginLeft ?? '370px'
          } - ${
            props.style?.marginRight ?? '10px'
          } - 360px)
        `
      };
    `
  };

  ${(props) =>
    props.placement === "bottom" && 
    `
      min-width: ${
        props.style?.width ??
        `
          calc(100% - ${
            props.style?.marginLeft ?? '370px'
          } - ${
            props.style?.marginRight ?? '10px'
          } - 360px)
        `
      };
    `
  };

`;

const StyledOffCanvasTitle = styled(Offcanvas.Title)`
  word-wrap: anywhere;
`;

const SlideSheet = ({
  children,
  onClose,
  title = "Properties",
  show = false,
  placement = "start",
  resizable = false,
  ...props
}) => {
  const handleClose = () => onClose();

  return (
    <StyledOffcanvas
      show={show}
      onHide={handleClose}
      placement={placement}
      backdrop={false}
      scroll={true}
      className="shadow-sm"
      {...props}
    >
      <StyledOffCanvasHeader closeButton>
        <StyledOffCanvasTitle>{title}</StyledOffCanvasTitle>
      </StyledOffCanvasHeader>
      <StyledOffCanvasBody
        placement={placement}
        style={{resize: resizable}}
      >
        {children}
      </StyledOffCanvasBody>
    </StyledOffcanvas>
  );
};

SlideSheet.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
  onClose: PropTypes.func,
  show: PropTypes.bool,
  title: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
  placement: PropTypes.oneOf(["start", "end", "top", "bottom"]),
  resizable: PropTypes.bool,
};

export default SlideSheet;
