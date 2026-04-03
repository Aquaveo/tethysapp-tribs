import PropTypes from "prop-types";
import { useEffect } from "react";
import { useFormikContext } from "formik";

const FormValuesObserver = ({ onChange }) => {
  const { values } = useFormikContext();

  useEffect(() => {
    onChange && onChange(values);
  }, [onChange, values]);

  return null;
};

FormValuesObserver.propTypes = {
  onChange: PropTypes.func,
};

export default FormValuesObserver;
