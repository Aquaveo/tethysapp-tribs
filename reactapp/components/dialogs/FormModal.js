import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import PropTypes from "prop-types";
import Spinner from "react-bootstrap/Spinner";
import { useRef, useState } from "react";

import newUUID from "lib/uuid";

const FormModal = ({
  children,
  onClose,
  onReset,
  onSubmit,
  title = "Form Modal",
  show = false,
  submitButtonTitle = "Submit",
}) => {
  const [formValidated, setFormValidated] = useState(false);
  const [formDisabled, setFormDisabled] = useState(false);
  const [processing, setProcessing] = useState(false);
  const isInvalidRef = useRef([]);
  const formId = newUUID();

  const resetModal = () => {
    // Call reset hook
    onReset && onReset();
    setFormValidated(false);
    setFormDisabled(false);
    setProcessing(false);
  };

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const form = event.currentTarget;
    isInvalidRef.current = [];
    const elements = form.elements;
    Array.from(elements).forEach((element) => {
      if(element.classList.contains("is-invalid")) {
        isInvalidRef.current.push(true);
      }
    });

    if (!form.checkValidity() || isInvalidRef.current.includes(true)) {
      setFormValidated(true);
      return;
    }

    // Validated
    setFormValidated(true);
    setFormDisabled(true);
    setProcessing(true);

    // Call submit hook
    onSubmit && onSubmit(event);
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      onExited={resetModal}
      backdrop="static"
      keyboard={false}
    >
      <Modal.Header closeButton>
        <Modal.Title as="h4">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form
          noValidate
          validated={formValidated}
          id={formId}
          onSubmit={handleSubmit}
        >
          <fieldset disabled={formDisabled}>{children([formValidated, setFormValidated])}</fieldset>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <>
          <Button
            form={formId}
            type="submit"
            variant="primary"
            disabled={processing}
            data-testid={`${title.toLowerCase().replaceAll(" ", "-")}-add-button`}
          >
            {processing && (
              <Spinner
                animation="border"
                role="status"
                size="sm"
                aria-hidden="true"
              />
            )}
            {submitButtonTitle}
          </Button>
          <Button
            variant="outline-secondary"
            onClick={handleClose}
            disabled={processing}
          >
            Cancel
          </Button>
        </>
      </Modal.Footer>
    </Modal>
  );
};

FormModal.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.func,
  ]),
  onClose: PropTypes.func,
  onReset: PropTypes.func,
  onSubmit: PropTypes.func,
  show: PropTypes.bool,
  submitButtonTitle: PropTypes.string,
  title: PropTypes.string,
};

export default FormModal;
