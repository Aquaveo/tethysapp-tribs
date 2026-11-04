import Form from "react-bootstrap/Form";
import ToggleButtonGroup from "react-bootstrap/ToggleButtonGroup";
import { useController } from "react-hook-form";

import { inputPropTypes } from "components/forms/propTypes";

const ButtonGroupInput = ({ label, size = "sm", type = "radio", ...props }) => {
  const { field, fieldState } = useController({ name: props.name });
  return (
    <Form.Group controlId={props.id || props.name} className="mb-2">
      <Form.Label className="d-block">{label}</Form.Label>
      <ToggleButtonGroup
        className="mb-2"
        type={type}
        size={size}
        value={field.value}
        onChange={(val) => field.onChange(val)}
        {...props}
      ></ToggleButtonGroup>
      {fieldState.error ? (
        <Form.Control.Feedback type="invalid">
          {fieldState.error.message}
        </Form.Control.Feedback>
      ) : null}
    </Form.Group>
  );
};

ButtonGroupInput.propTypes = inputPropTypes;

export default ButtonGroupInput;
