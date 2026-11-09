import Form from "react-bootstrap/Form";
import PropTypes from "prop-types";
import { useController } from "react-hook-form";
import { inputPropTypes } from "components/forms/propTypes";
import { Row, Col } from "react-bootstrap";
import ToolTip from "components/buttons/ToolTips";

const TextInput = ({ label, size = "m", type = "text", tooltip = "", ...props }) => {
  const { field, fieldState } = useController({ name: props.name });
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
        <Form.Control
          {...field}
          {...props}
          value={field.value ?? ""}
          size={size}
          type={type}
          isInvalid={!!fieldState.error}
        />
        <Form.Control.Feedback type="invalid">{fieldState.error?.message}</Form.Control.Feedback>
      </Col>
    </Form.Group>
  );
};

TextInput.propTypes = {
  ...inputPropTypes,
  type: PropTypes.string,
  tooltip: PropTypes.string
};

export default TextInput;
