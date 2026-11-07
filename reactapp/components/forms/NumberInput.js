import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import PropTypes from "prop-types";
import { useController } from "react-hook-form";

import { inputPropTypes } from "components/forms/propTypes";
import { Col, Row } from "react-bootstrap";
import ToolTip from "components/buttons/ToolTips";

const NumberInput = ({ label, size = "m", units = "", tooltip = "", ...props }) => {
  const { field, fieldState } = useController({ name: props.name });

  // Store numbers, not strings, like Formik did for type="number" inputs
  const handleChange = (event) => {
    const parsed = parseFloat(event.target.value);
    field.onChange(isNaN(parsed) ? "" : parsed);
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
      <Col sm={9}>
        <InputGroup size={size}>
          <Form.Control
            {...field}
            {...props}
            value={field.value ?? ""}
            onChange={handleChange}
            type="number"
            size={size}
            isInvalid={!!fieldState.error}
          />
          {units && <InputGroup.Text>{units}</InputGroup.Text>}
          <Form.Control.Feedback type="invalid">
            {fieldState.error?.message}
          </Form.Control.Feedback>
        </InputGroup>
      </Col>
    </Form.Group>
  );
};

NumberInput.propTypes = {
  ...inputPropTypes,
  units: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  tooltip: PropTypes.string
};

export default NumberInput;
