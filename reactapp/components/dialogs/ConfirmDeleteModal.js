import PropTypes from "prop-types";
import { Button, Modal } from "react-bootstrap";

export const ConfirmDeleteModal = ({
  showConfirm,
  handleDeleteCancel,
  handleDeleteConfirm,
  message = "Default Message",
  title = "Confirm Delete"
}) => {
  return (
    <Modal show={showConfirm} onHide={handleDeleteCancel}>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{message}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleDeleteCancel}>
          No
        </Button>
        <Button variant="danger" onClick={handleDeleteConfirm}>
          Yes
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

ConfirmDeleteModal.propTypes = {
  showConfirm: PropTypes.bool.isRequired,
  handleDeleteCancel: PropTypes.func.isRequired,
  handleDeleteConfirm: PropTypes.func.isRequired,
  message: PropTypes.string,
  title: PropTypes.string,
};
