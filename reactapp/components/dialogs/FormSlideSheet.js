import PropTypes from "prop-types";
import Stack from "react-bootstrap/Stack";
import { Form, Formik } from "formik";

import SlideSheet from "components/dialogs/SlideSheet";
import SubmitButton from "components/forms/SubmitButton";

const FormSlideSheet = ({
  children,
  title,
  initialValues,
  validationSchema,
  show = false,
  onClose,
  onSubmit,
  ...props
}) => {
  const handleClose = () => {
    onClose && onClose();
  };

  return (
    <SlideSheet title={title} show={show} onClose={handleClose} {...props}>
      <Formik
        enableReinitialize={true}
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {(formik) => (
          <Form>
            {children(formik)}
            {formik.dirty && (
              <Stack direction="horizontal" gap={2}>
                <SubmitButton title="Save" />
                <SubmitButton title="Save & Close" onClick={handleClose} />
              </Stack>
            )}
          </Form>
        )}
      </Formik>
    </SlideSheet>
  );
};

FormSlideSheet.propTypes = {
  children: PropTypes.func,
  title: PropTypes.string,
  initialValues: PropTypes.object,
  validationSchema: PropTypes.object,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
  show: PropTypes.bool,
};

export default FormSlideSheet;
