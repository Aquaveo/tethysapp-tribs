import { useContext, useEffect } from "react";
import PropTypes from "prop-types";
import Form from "react-bootstrap/Form";
import { FastField, useFormikContext } from "formik";
import { Row, Col } from "react-bootstrap";
import Select from "react-select";

import { inputPropTypes } from "components/forms/propTypes";
import ToolTip from "components/buttons/ToolTips";
import { ProjectObjectContext } from "react-tethys/context";

const SelectInput = ({ label, size = "sm", tooltip = "", options, ...props }) => {
  const inputId = props.id || props.name

  const { setFieldValue, values } = useFormikContext();

  const {
    dataObject,
    projectObjectLocation,
    setProjectObjectLocation
  } = useContext(ProjectObjectContext);

  useEffect(() => {
    // This is only used with the FileSelect component
    if (props.name === projectObjectLocation && dataObject) {
      const currentDataObject = Object.values(dataObject).find(
        data => data.objectLocation === projectObjectLocation
      ) || null;

      if (currentDataObject && values[props.name] !== currentDataObject.id) {
        setFieldValue(props.name, currentDataObject.id);
        setProjectObjectLocation(null);
      }
    }
  }, [dataObject, projectObjectLocation, props.name, setFieldValue, setProjectObjectLocation, values]);

  const handleChange = (selectedOption, { setFieldValue }, { name }) => {
    setFieldValue(name, selectedOption.value);
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
          <Col sm={9} data-testid={label}>
            <Select
              id={inputId}
              aria-label={label}
              {...field}
              {...props}
              options={options}
              defaultValue={options[0]}
              value={options ? options.find(option => option.value === field.value) : ""}
              size={size}
              isSearchable
              onChange={(selectedOption) => handleChange(selectedOption, form, field)}
              isDisabled={props.readOnly}
              styles={{
                control: (styles, { isDisabled }) => ({
                  ...styles,
                  borderColor: isDisabled ? "rgb(206, 212, 218)" : "hsl(0, 0%, 80%)",
                }),
                valueContainer: (styles, { isDisabled }) => ({
                  ...styles,
                  backgroundColor: isDisabled ? "#e9ecef" : "default",
                }),
                singleValue: (styles, { isDisabled }) => ({
                  ...styles,
                  color: isDisabled ? "#212529" : "default",
                }),
                multiValue: (styles, { isDisabled }) => ({
                  ...styles,
                  color: isDisabled ? "#212529" : "default",
                }),
                indicatorsContainer: (styles, { isDisabled }) => ({
                  ...styles,
                  backgroundColor: isDisabled ? "#e9ecef" : "default",
                }),
                dropdownIndicator: (styles, { isDisabled }) => ({
                  ...styles,
                  color: isDisabled ? "#212529" : "default",
                })
              }}
            />
            <Form.Control.Feedback type="invalid">
              {meta.error}
            </Form.Control.Feedback>
          </Col>
        </Form.Group>
      )}
    </FastField>
  );
};

SelectInput.propTypes = {
  ...inputPropTypes,
  tooltip: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType(
        [PropTypes.string, PropTypes.number]
      ).isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default SelectInput;
