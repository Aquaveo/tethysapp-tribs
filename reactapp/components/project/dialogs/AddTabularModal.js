import Form from "react-bootstrap/Form";
import PropTypes from "prop-types";
import { useRef, useState } from "react";

import FormModal from "components/dialogs/FormModal";
import { DATASET_GROUPS, DATASET_TYPE_MAPS, DATASET_TYPE_TO_NORMALIZED_STRING } from "constants/projectConstants";
import removeZipExtension from "lib/removeZipExt";

const AddTabularModal = ({ onSubmit, onClose, show = false }) => {
  const [tabularName, setTabularName] = useState("");
  const [tabularType, setTabularType] = useState("");

  const nameInputRef = useRef();
  const fileInputRef = useRef();

  const resetFields = () => {
    setTabularName("");
    setTabularType("");
  };

  const handleClose = () => {
    onClose && onClose();
  };

  const handleFileChange = (event, setFormValidated) => {
    // Derive default geom name from file name
    let fileName = removeZipExtension(event.target.files[0].name);

    // Only overwrite if no value provided yet
    if (!tabularName) {
      setTabularName(fileName);
    }

    // Set focus to name field
    nameInputRef.current.focus();
    setFormValidated(false);
  };

  const handleTabularTypeChange = (event) => {
    event.preventDefault();
    setTabularType(event.target.value)
  }

  const handleSubmit = (event) => {
    const files = fileInputRef.current.files
    onSubmit({
      name: tabularName,
      data: event.target.result,
      files: files,
      type: tabularType,
    });

    // Close dialog
    handleClose();
  };

  const handleNameChange = (evt, setFormValidated) => {
    setTabularName(evt.target.value);
    setFormValidated(true);
  };

  return (
    <FormModal
      title="Add Tabular Dataset"
      submitButtonTitle="Add"
      show={show}
      onClose={handleClose}
      onReset={resetFields}
      onSubmit={handleSubmit}
    >
      {([formValidated, setFormValidated]) => (
        <>
          <Form.Group className="mb-3" controlId="add-tabular-file-control">
            <Form.Label>File</Form.Label>
            <Form.Control
              type="file"
              // accept=".stl,.gdf"
              ref={fileInputRef}
              onChange={(event) => handleFileChange(event, setFormValidated)}
              multiple
              isInvalid={formValidated && !fileInputRef.current?.files.length}
            />
            {formValidated && !fileInputRef.current?.files.length && (
              <Form.Control.Feedback type="invalid">
                Please select a valid geometry file (.stl, .gdf).
              </Form.Control.Feedback>
            )}
          </Form.Group>
          <Form.Group className="mb-3" controlId="add-tabular-name-control">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              onChange={(evt) => handleNameChange(evt, setFormValidated)}
              value={tabularName}
              ref={nameInputRef}
              required
              isInvalid={formValidated && !tabularName}
            />
            {formValidated && !tabularName && (
              <Form.Control.Feedback type="invalid">
                Please provide a name for the Tabular Dataset.
              </Form.Control.Feedback>
            )}
          </Form.Group>
          <Form.Group className="mb-3" controlId="select-tabular-type-control">
            <Form.Label>Select Tabular Dataset Type</Form.Label>
            <Form.Control
              as="select"
              value={tabularType}
              onChange={handleTabularTypeChange}
              required
              isInvalid={formValidated && !tabularType}
            >
              <option value="">Select a Tabular Dataset Type</option>
              {Object.keys(DATASET_TYPE_MAPS)
                .filter((type) => DATASET_TYPE_MAPS[type] === DATASET_GROUPS.TABULAR)
                .map((type) => (
                  <option key={type} value={type}>{DATASET_TYPE_TO_NORMALIZED_STRING[type]}</option>
                ))
              }
            </Form.Control>
            {formValidated && !tabularType && (
              <Form.Control.Feedback type="invalid">
                Please provide a type for the Tabular Dataset.
              </Form.Control.Feedback>
            )}
          </Form.Group>
        </>
      )}
    </FormModal>
  );
};

AddTabularModal.propTypes = {
  onSubmit: PropTypes.func,
  onClose: PropTypes.func,
  show: PropTypes.bool,
};

export default AddTabularModal;
