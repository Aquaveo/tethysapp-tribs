import Form from "react-bootstrap/Form";
import PropTypes from "prop-types";
import { useRef, useState } from "react";

import FormModal from "components/dialogs/FormModal";
import { DATASET_GROUPS, DATASET_TYPE_MAPS, DATASET_TYPE_TO_NORMALIZED_STRING } from "constants/projectConstants";
import SpatialDropdown from "../forms/SpatialDropdown";
import removeZipExtension from "lib/removeZipExt";

const AddGenericDatasetModal = ({ onSubmit, onClose, show = false }) => {
  const [datasetName, setDatasetName] = useState("");
  const [datasetType, setDatasetType] = useState("");
  const [spatial, setSpatial] = useState("");

  const nameInputRef = useRef();
  const fileInputRef = useRef();

  const resetFields = () => {
    setDatasetName("");
    setDatasetType("");
    setSpatial("");
  };

  const handleClose = () => {
    onClose && onClose();
  };

  const handleFileChange = (event, setFormValidated) => {
    // Derive default geom name from file name
    let fileName = removeZipExtension(event.target.files[0].name);

    // Only overwrite if no value provided yet
    if (!datasetName) {
      setDatasetName(fileName);
    }

    // Set focus to name field
    nameInputRef.current.focus();
    setFormValidated(false);
  };

  const handleDatasetTypeChange = (event) => {
    event.preventDefault();
    setDatasetType(event.target.value)
  }

  const handleSpatialChange = (option) => {
    setSpatial(option.value)
  }

  const handleSubmit = (event) => {
    const files = fileInputRef.current.files
    onSubmit({
      name: datasetName,
      data: event.target.result,
      files: files,
      type: datasetType,
      srid: spatial,
    });

    // Close dialog
    handleClose();
  };

  const handleNameChange = (evt, setFormValidated) => {
    setDatasetName(evt.target.value);
    setFormValidated(true);
  };

  return (
    <FormModal
      title="Add Dataset"
      submitButtonTitle="Add"
      show={show}
      onClose={handleClose}
      onReset={resetFields}
      onSubmit={handleSubmit}
    >
      {([formValidated, setFormValidated]) => (
        <>
          <Form.Group className="mb-3" controlId="add-dataset-file-control">
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
          <Form.Group className="mb-3" controlId="add-dataset-name-control">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              onChange={(evt) => handleNameChange(evt, setFormValidated)}
              value={datasetName}
              ref={nameInputRef}
              required
              isInvalid={formValidated && !datasetName}
            />
            {formValidated && !datasetName && (
              <Form.Control.Feedback type="invalid">
                Please provide a name for the Dataset.
              </Form.Control.Feedback>
            )}
          </Form.Group>
          <Form.Group className="mb-3" controlId="select-dataset-type-control">
            <Form.Label>Select Dataset Type</Form.Label>
            <Form.Control
              as="select"
              value={datasetType}
              onChange={handleDatasetTypeChange}
              required
              isInvalid={formValidated && !datasetType}
            >
              <option value="">Select a Dataset Type</option>
              {Object.keys(DATASET_TYPE_MAPS)
                .map((type) => (
                  (DATASET_TYPE_MAPS[type] !== DATASET_GROUPS.OUTPUT && 
                    <option key={type} value={type}>
                      {`${DATASET_TYPE_TO_NORMALIZED_STRING[type]}`}
                    </option>
                  )
                ))
              }
            </Form.Control>
            {formValidated && !datasetType && (
              <Form.Control.Feedback type="invalid">
                Please provide a type for the Dataset.
              </Form.Control.Feedback>
            )}
          </Form.Group>
          <Form.Group className="mb-3" controlId="spatial-reference-system-control">
            <Form.Label>Spatial Reference System</Form.Label>
            <SpatialDropdown onSelect={handleSpatialChange} select={spatial} />
          </Form.Group>
        </>
      )}
    </FormModal>
  );
};

AddGenericDatasetModal.propTypes = {
  onSubmit: PropTypes.func,
  onClose: PropTypes.func,
  show: PropTypes.bool,
};

export default AddGenericDatasetModal;
