import PropTypes from "prop-types";
import Stack from "react-bootstrap/Stack";
import { Form, Formik } from "formik";

import SubmitButton from "components/forms/SubmitButton";
import SettingsModal from "./SettingsModal";
import styled from "styled-components";

const StickyStack = styled(Stack)`
  position: sticky;
  bottom: 0;
  background-color: #fff;
`;

const FormikSheet = ({
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
    <SettingsModal title={title} show={show} onClose={handleClose} {...props}>
      <Formik
        enableReinitialize={true}
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {(formik) => {
          const { handleSubmit, values } = formik;
          const handleSave = () => {
            handleSubmit(values);
            onSubmit(values);
          }
          const handleSaveClose = () => {
            handleSubmit(values);
            onSubmit(values);
            handleClose();
          }
          return (
            <Form>
              {children(formik)}
              {formik.dirty && (
                <StickyStack direction="horizontal" gap={2}>
                  <SubmitButton title="Save" onClick={handleSave} />
                  <SubmitButton title="Save & Close" onClick={handleSaveClose} />
                </StickyStack>
              )}
            </Form>
          );
        }}
      </Formik>
    </SettingsModal>
  );
};

FormikSheet.propTypes = {
  children: PropTypes.func,
  title: PropTypes.string,
  initialValues: PropTypes.object,
  validationSchema: PropTypes.object,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
  show: PropTypes.bool,
};

export default FormikSheet;
