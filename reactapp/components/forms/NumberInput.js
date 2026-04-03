import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import PropTypes from "prop-types";
import { FastField } from "formik";

import { inputPropTypes } from "components/forms/propTypes";
import { Col, Row } from "react-bootstrap";
import ToolTip from "components/buttons/ToolTips";

const NumberInput = ({ label, size = "m", units = "", tooltip = "", ...props }) => {
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
            <InputGroup size={size}>
              <Form.Control
                {...field}
                {...props}
                type="number"
                size={size}
                isInvalid={meta.touched && meta.error}
              />
              {units && <InputGroup.Text>{units}</InputGroup.Text>}
              <Form.Control.Feedback type="invalid">
                {meta.error}
              </Form.Control.Feedback>
            </InputGroup>
          </Col>
        </Form.Group>
      )}
    </FastField>
  );
};

NumberInput.propTypes = {
  ...inputPropTypes,
  units: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  tooltip: PropTypes.string
};

export default NumberInput;
