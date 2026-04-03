import Form from "react-bootstrap/Form";
import PropTypes from "prop-types";
import { useRef, useState } from "react";

import FormModal from "components/dialogs/FormModal";
import { DATASET_GROUPS, DATASET_TYPE_MAPS, DATASET_TYPE_TO_NORMALIZED_STRING } from "constants/projectConstants";
import SpatialDropdown from "../forms/SpatialDropdown";
import removeZipExtension from "lib/removeZipExt";

const AddMeshModal = ({ onSubmit, onClose, show = false }) => {
  const [meshName, setMeshName] = useState("");
  const [meshType, setMeshType] = useState("");
  const [spatial, setSpatial] = useState("");

  const nameInputRef = useRef();
  const fileInputRef = useRef();

  const resetFields = () => {
    setMeshName("");
    setMeshType("");
    setSpatial("");
  };

  const handleClose = () => {
    onClose && onClose();
  };

  const handleFileChange = (event, setFormValidated) => {
    // Derive default geom name from file name
    let fileName = removeZipExtension(event.target.files[0].name);

    // Only overwrite if no value provided yet
    if (!meshName) {
      setMeshName(fileName);
    }

    // Set focus to name field
    nameInputRef.current.focus();
    setFormValidated(false);
  };

  const handleMeshTypeChange = (event) => {
    event.preventDefault();
    setMeshType(event.target.value)
  }

  const handleSpatialChange = (option) => {
    setSpatial(option.value)
  }

  const handleSubmit = (event) => {
    const files = fileInputRef.current.files;
    onSubmit({
      name: meshName,
      data: event.target.result,
      files: files,
      type: meshType,
      srid: spatial,
    });

    // Close dialog
    handleClose();
  };

  const handleNameChange = (evt, setFormValidated) => {
    setMeshName(evt.target.value);
    setFormValidated(true);
  };

  return (
    <FormModal
      title="Add Mesh"
      submitButtonTitle="Add"
      show={show}
      onClose={handleClose}
      onReset={resetFields}
      onSubmit={handleSubmit}
    >
      {([formValidated, setFormValidated]) => (
        <>
          <Form.Group className="mb-3" controlId="add-mesh-file-control">
            <Form.Label>File</Form.Label>
            <Form.Control
              type="file"
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
          <Form.Group className="mb-3" controlId="add-mesh-name-control">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              onChange={(evt) => handleNameChange(evt, setFormValidated)}
              value={meshName}
              ref={nameInputRef}
              required
              isInvalid={formValidated && !meshName}
            />
            {formValidated && !meshName && (
              <Form.Control.Feedback type="invalid">
                Please provide a name for the Mesh.
              </Form.Control.Feedback>
            )}
          </Form.Group>
          <Form.Group className="mb-3" controlId="select-mesh-type-control">
            <Form.Label>Select Mesh Type</Form.Label>
            <Form.Control
              as="select"
              value={meshType}
              onChange={handleMeshTypeChange}
              required
              isInvalid={formValidated && !meshType}
            >
              <option value="">Select a Mesh Type</option>
              {Object.keys(DATASET_TYPE_MAPS)
                .filter((type) => DATASET_TYPE_MAPS[type] === DATASET_GROUPS.MESH)
                .map((type) => (
                  <option key={type} value={type}>{DATASET_TYPE_TO_NORMALIZED_STRING[type]}</option>
                ))
              }
            </Form.Control>
            {formValidated && !meshType && (
              <Form.Control.Feedback type="invalid">
                Please provide a type for the Mesh.
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

AddMeshModal.propTypes = {
  onSubmit: PropTypes.func,
  onClose: PropTypes.func,
  show: PropTypes.bool,
};

export default AddMeshModal;
