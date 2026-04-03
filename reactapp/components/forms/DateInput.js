import Form from "react-bootstrap/Form";
import { FastField } from "formik";
import DatePicker from "react-datepicker";
import PropTypes from "prop-types";
import "react-datepicker/dist/react-datepicker.css";

import { inputPropTypes } from "components/forms/propTypes";
import { Row, Col } from "react-bootstrap";
import { createGlobalStyle } from "styled-components";
import ToolTip from "components/buttons/ToolTips";

const DatePickerWrapperStyles = createGlobalStyle`
  .date_picker {
    display: block;
  }
  .date_popper {
    z-index: 10;
  }
`;

const DateInput = ({ label, size = "sm", tooltip = "", ...props }) => {
  const inputId = props.id || props.name

  const handleChange = (date, { setFieldValue }, { name }) => {
    setFieldValue(name, date);
  };

  return (
    <FastField name={props.name}>
      {({ field, meta, form }) => (
        <Form.Group as={Row} controlId={inputId} className="mb-2">
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
            <DatePicker
              id={inputId}
              wrapperClassName="date_picker"
              selected={field.value}
              onChange={(date) => handleChange(date, form, field)}
              className="form-control"
              dateFormat="MM/dd/yyyy"
              {...props}
              popperClassName="date_popper"
            />
            <DatePickerWrapperStyles />
            <div
              className="invalid-feedback"
              style={{ display: meta.error !== undefined ? "flex" : "none" }}
            >
              {meta.error}
            </div>
          </Col>
        </Form.Group>
      )}
    </FastField>
  );
};

DateInput.propTypes = {
  ...inputPropTypes,
  tooltip: PropTypes.string
};

export default DateInput;
