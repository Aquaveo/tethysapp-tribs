import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import PropTypes from "prop-types";
import InputGroup from "react-bootstrap/InputGroup";
import { FastField } from "formik";
import { useRef } from "react";

import { inputPropTypes } from "components/forms/propTypes";
import { Col, Row } from "react-bootstrap";
import ToolTip from "components/buttons/ToolTips";

const FileInput = ({ label, size = "m", tooltip = "", ...props }) => {
  const fileInputRef = useRef();

  const handleFileChange = (event, { setFieldValue }, { name }) => {
    if (event.target.files.length > 0) {
      setFieldValue(name, event.target.files[0]);
    } else {
      setFieldValue(name, null);
    }
  };

  const handleClearClick = (event, { setFieldValue }, { name }) => {
    setFieldValue(name, null);
  };

  return (
    <FastField name={props.name}>
      {({ field, meta, form }) => (
        <Form.Group as={Row} controlId={props.id || props.name} className="mb-2">
          <Col
            sm={3} 
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "end",
              paddingRight: "unset"
            }}
          >
            <Form.Label style={{ marginBottom: "unset" }}>
              {label}
            </Form.Label>
            {tooltip && <ToolTip message={tooltip} keyName={props.id || props.name} />}
          </Col>
          {!field.value ? (
            <Col sm={9}>
              <Form.Control
                name={field.name}
                ref={fileInputRef}
                type="file"
                size={size}
                onChange={(file) => handleFileChange(file, form, field)}
                {...props}
                isInvalid={meta.touched && !!meta.error}
              />
            </Col>
          ) : (
            <Col sm={9}>
              <InputGroup size={size}>
                <Button
                  title="Remove File"
                  variant="outline-danger"
                  onClick={(event) => handleClearClick(event, form, field)}
                >
                  Remove File
                </Button>
                <Form.Control
                  type="text"
                  size={size}
                  title={field.value.name}
                  defaultValue={field.value.name}
                  isInvalid={meta.touched && !!meta.error}
                  readOnly
                />
                <Form.Control.Feedback type="invalid">
                  {meta.error}
                </Form.Control.Feedback>
              </InputGroup>
            </Col>
          )}
        </Form.Group>
      )}
    </FastField>
  );
};

FileInput.propTypes = {
  ...inputPropTypes,
  tooltip: PropTypes.string
};

export default FileInput;
