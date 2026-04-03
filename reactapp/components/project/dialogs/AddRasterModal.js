import Form from "react-bootstrap/Form";
import PropTypes from "prop-types";
import { useRef, useState } from "react";

import FormModal from "components/dialogs/FormModal";
import { DATASET_GROUPS, DATASET_TYPE_MAPS, DATASET_TYPE_TO_NORMALIZED_STRING } from "constants/projectConstants";
import SpatialDropdown from "../forms/SpatialDropdown";
import removeZipExtension from "lib/removeZipExt";

const AddRasterModal = ({ onSubmit, onClose, show = false }) => {
  const [rasterName, setRasterName] = useState("");
  const [rasterType, setRasterType] = useState("");
  const [spatial, setSpatial] = useState("");

  const nameInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const resetFields = () => {
    setRasterName("");
    setRasterType("");
    setSpatial("");
  };

  const handleClose = () => {
    onClose && onClose();
  };

  const handleFileChange = (event, setFormValidated) => {
    // Derive default geom name from file name
    let fileName = removeZipExtension(event.target.files[0].name);

    // Only overwrite if no value provided yet
    if (!rasterName) {
      setRasterName(fileName);
    }

    // Set focus to name field
    nameInputRef.current.focus();
    setFormValidated(false);
  };

  const handleRasterTypeChange = (event) => {
    event.preventDefault();
    setRasterType(event.target.value)
  }

  const handleSpatialChange = (option) => {
    setSpatial(option.value)
  }

  const handleSubmit = (event) => {
    const files = fileInputRef.current.files
    onSubmit({
      name: rasterName,
      data: event.target.result,
      files: files,
      type: rasterType,
      srid: spatial,
    });

    // Close dialog
    handleClose();
  };

  const handleNameChange = (evt, setFormValidated) => {
    setRasterName(evt.target.value);
    setFormValidated(true);
  };

  return (
    <FormModal
      title="Add Raster"
      submitButtonTitle="Add"
      show={show}
      onClose={handleClose}
      onReset={resetFields}
      onSubmit={handleSubmit}
    >
      {([formValidated, setFormValidated]) => (
        <>
          <Form.Group className="mb-3" controlId="add-raster-file-control">
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
          <Form.Group className="mb-3" controlId="add-raster-name-control">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              onChange={(event) => handleNameChange(event, setFormValidated)}
              value={rasterName}
              ref={nameInputRef}
              required
              isInvalid={formValidated && !rasterName}
            />
            {formValidated && !rasterName && (
              <Form.Control.Feedback type="invalid">
                Please provide a name for the Raster.
              </Form.Control.Feedback>
            )}
          </Form.Group>
          <Form.Group className="mb-3" controlId="select-raster-type-control">
            <Form.Label>Select Raster Type</Form.Label>
            <Form.Control
              as="select"
              value={rasterType}
              onChange={handleRasterTypeChange}
              required
              isInvalid={formValidated && !rasterType}
            >
              <option value="">Select a Raster Type</option>
              {Object.keys(DATASET_TYPE_MAPS)
                .filter((type) => DATASET_TYPE_MAPS[type] === DATASET_GROUPS.RASTER)
                .map((type) => (
                  <option key={type} value={type}>{DATASET_TYPE_TO_NORMALIZED_STRING[type]}</option>
                ))
              }
            </Form.Control>
            {formValidated && !rasterType && (
              <Form.Control.Feedback type="invalid">
                Please provide a type for the Raster.
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

AddRasterModal.propTypes = {
  onSubmit: PropTypes.func,
  onClose: PropTypes.func,
  show: PropTypes.bool,
};

export default AddRasterModal;
