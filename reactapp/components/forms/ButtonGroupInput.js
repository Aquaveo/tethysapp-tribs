import Form from "react-bootstrap/Form";
import ToggleButtonGroup from "react-bootstrap/ToggleButtonGroup";
import { useField } from "formik";

import { inputPropTypes } from "components/forms/propTypes";

const ButtonGroupInput = ({ label, size = "sm", type = "radio", ...props }) => {
  const [field, meta, helpers] = useField(props);
  return (
    <Form.Group controlId={props.id || props.name} className="mb-2">
      <Form.Label className="d-block">{label}</Form.Label>
      <ToggleButtonGroup
        className="mb-2"
        type={type}
        size={size}
        value={field.value}
        onChange={(val) => helpers.setValue(val)}
        {...props}
      ></ToggleButtonGroup>
      {meta.error ? (
        <Form.Control.Feedback type="invalid">
          {meta.error}
        </Form.Control.Feedback>
      ) : null}
    </Form.Group>
  );
};

ButtonGroupInput.propTypes = inputPropTypes;

export default ButtonGroupInput;
