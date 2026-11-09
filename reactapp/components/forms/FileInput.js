import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import PropTypes from "prop-types";
import InputGroup from "react-bootstrap/InputGroup";
import { useController } from "react-hook-form";
import { useRef } from "react";

import { inputPropTypes } from "components/forms/propTypes";
import { Col, Row } from "react-bootstrap";
import ToolTip from "components/buttons/ToolTips";

const FileInput = ({ label, size = "m", tooltip = "", ...props }) => {
  const fileInputRef = useRef();
  const { field, fieldState } = useController({ name: props.name });

  const handleFileChange = (event) => {
    if (event.target.files.length > 0) {
      field.onChange(event.target.files[0]);
    } else {
      field.onChange(null);
    }
  };

  const handleClearClick = () => {
    field.onChange(null);
  };

  return (
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
            onChange={handleFileChange}
            onBlur={field.onBlur}
            {...props}
            isInvalid={!!fieldState.error}
          />
        </Col>
      ) : (
        <Col sm={9}>
          <InputGroup size={size}>
            <Button
              title="Remove File"
              variant="outline-danger"
              onClick={handleClearClick}
            >
              Remove File
            </Button>
            <Form.Control
              type="text"
              size={size}
              title={field.value.name}
              defaultValue={field.value.name}
              isInvalid={!!fieldState.error}
              readOnly
            />
            <Form.Control.Feedback type="invalid">
              {fieldState.error?.message}
            </Form.Control.Feedback>
          </InputGroup>
        </Col>
      )}
    </Form.Group>
  );
};

FileInput.propTypes = {
  ...inputPropTypes,
  tooltip: PropTypes.string
};

export default FileInput;
