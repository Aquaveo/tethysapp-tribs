import styled from "styled-components";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import PropTypes from "prop-types";
import { useCallback, useEffect, useRef, useState } from "react";
import { BsCheck, BsX } from "react-icons/bs";

import MinimalButton from "components/buttons/MinimalButton";

const MinimalFormControl = styled(Form.Control)`
  font-size: 16px;
`;

const InlineTextControl = ({ onSave, onCancel, ...props }) => {
  // Prevent strings with only whitespace
  const inputControlRef = useRef();
  const [isValid, setIsValid] = useState(true);

  const validateText = useCallback(() => {
    if (!inputControlRef.current) {
      return;
    } // input control gone
    const valid = inputControlRef.current.checkValidity();
    setIsValid(valid);
    return valid;
  }, []);

  const handleSave = useCallback(() => {
    const nameIsValid = validateText();
    if (nameIsValid) {
      onSave(inputControlRef.current.value);
    }
  }, [onSave, validateText]);

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  useEffect(() => {
    const inputControl = inputControlRef.current;
    inputControl.focus();
    inputControl.select();
    inputControl.addEventListener("keydown", (event) => {
      switch (event.code) {
        case "Enter":
        case "NumpadEnter":
          event.preventDefault();
          handleSave();
          break;
        case "Escape":
          event.preventDefault();
          handleCancel();
          break;
        default:
          break;
      }
    });
  }, [handleSave, handleCancel]);

  return (
    <div className="d-flex" style={{width: "100%"}}>
      <InputGroup>
        <MinimalFormControl
          ref={inputControlRef}
          size="sm"
          className={isValid ? "me-1 is-valid" : "me-1 is-invalid"}
          onChange={validateText}
          {...props}
        />
      </InputGroup>
      <MinimalButton
        variant="outline-secondary"
        title="Save"
        size="sm"
        onClick={handleSave}
        disabled={!isValid}
      >
        <BsCheck />
      </MinimalButton>
      <MinimalButton
        variant="outline-secondary"
        title="Cancel"
        size="sm"
        onClick={handleCancel}
      >
        <BsX />
      </MinimalButton>
    </div>
  );
};

InlineTextControl.propTypes = {
  onSave: PropTypes.func,
  onCancel: PropTypes.func,
};

export default InlineTextControl;
