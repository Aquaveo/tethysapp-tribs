import Modal from "react-bootstrap/Modal";
import styled from "styled-components";
import PropTypes from "prop-types";

const ModalWindow = styled(Modal)`
  & > * {
    max-width: 1000px;
    height: 60vh;
    width: 75vw;
  }
`; 

const ModalBody = styled(Modal.Body)`
  padding: unset;
  padding-right: 1rem;
  padding-left: 1rem;
  margin-bottom: 1rem;
  height: 60vh;
`;

const ModalHeader = styled(Modal.Header)`
  & > .btn-close {
    margin: -0.5rem -0.5rem -0.5rem;
  }
`;

const SettingsModal = ({
  children,
  onClose,
  title = "Settings",
  show = false,
}) => {

  const handleClose = () => {
    onClose();
  };

  return (
    <ModalWindow
      show={show}
      onHide={handleClose}
      onExited={handleClose}
      backdrop="static"
      keyboard={false}
      scrollable
    >
      <ModalHeader closeButton>
        <Modal.Title as="h4" style={{margin: 'auto'}}>{title}</Modal.Title>
      </ModalHeader>
      <ModalBody>{children}</ModalBody>
    </ModalWindow>
  );
};

SettingsModal.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
  onClose: PropTypes.func,
  show: PropTypes.bool,
  title: PropTypes.string,
};

export default SettingsModal;
