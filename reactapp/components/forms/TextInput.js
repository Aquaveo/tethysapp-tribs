import Form from "react-bootstrap/Form";
import PropTypes from "prop-types";
import { FastField } from "formik";

import { inputPropTypes } from "components/forms/propTypes";
import { Row, Col } from "react-bootstrap";
import ToolTip from "components/buttons/ToolTips";

const TextInput = ({ label, size = "m", type = "text", tooltip = "", ...props }) => {
  return (
    <FastField name={props.name}>
      {({ field, meta }) => (
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
          <Col sm={9}>
            <Form.Control
              {...field}
              {...props}
              size={size}
              type={type}
              isInvalid={meta.touched && meta.error}
            />
            <Form.Control.Feedback type="invalid">{meta.error}</Form.Control.Feedback>
          </Col>
        </Form.Group>
      )}
    </FastField>
  );
};

TextInput.propTypes = {
  ...inputPropTypes,
  type: PropTypes.string,
  tooltip: PropTypes.string
};

export default TextInput;
