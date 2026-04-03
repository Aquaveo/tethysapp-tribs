import Modal from "react-bootstrap/Modal";
import PropTypes from "prop-types";

const ReconnectingModal = ({
  title = "Reconnecting to Backend",
  show = false,
  message = "WebSocket connection lost, attempting to reconnect..."
}) => {
  return (
    <Modal
      show={show}
      backdrop="static"
      keyboard={false}
    >
      <Modal.Header>
        <Modal.Title as="h4">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {message}
      </Modal.Body>
    </Modal>
  );
};

ReconnectingModal.propTypes = {
  show: PropTypes.bool,
  title: PropTypes.string,
  message: PropTypes.string
};

export default ReconnectingModal;
