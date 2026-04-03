import Form from "react-bootstrap/Form";
import PropTypes from "prop-types";
import { useRef, useState } from "react";

import FormModal from "components/dialogs/FormModal";
import removeZipExtension from "lib/removeZipExt";

const AddScenarioModal = ({ onSubmit, onClose, show = false }) => {
  const [scenarioName, setScenarioName] = useState("");
  const nameInputRef = useRef();

  const resetFields = () => {
    setScenarioName("");
  };

  const handleClose = () => {
    onClose && onClose();
  };

  const handleSubmit = (event) => {
    // Send message to backend
    // Scenario Create Action
    onSubmit({
      name: removeZipExtension(scenarioName),
      data: event.target.result,
      file: "file",
      type: "stl",
    });

    // Close dialog
    handleClose();
  };

  return (
    <FormModal
      title="Add Scenario"
      submitButtonTitle="Add"
      show={show}
      onClose={handleClose}
      onReset={resetFields}
      onSubmit={handleSubmit}
    >
      {(formValidated) => (
        <>
          <Form.Group className="mb-3" controlId="add-scenario-name-control">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              onChange={(evt) => setScenarioName(evt.target.value)}
              value={scenarioName}
              ref={nameInputRef}
              required
            />
            <Form.Control.Feedback type="invalid">
              Please provide a name for the Scenario.
            </Form.Control.Feedback>
          </Form.Group>
        </>
      )}
    </FormModal>
  );
};

AddScenarioModal.propTypes = {
  onSubmit: PropTypes.func,
  onClose: PropTypes.func,
  show: PropTypes.bool,
};

export default AddScenarioModal;
