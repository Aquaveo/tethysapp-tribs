import PropTypes from "prop-types";
import Stack from "react-bootstrap/Stack";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import SubmitButton from "components/forms/SubmitButton";
import SettingsModal from "./SettingsModal";
import styled from "styled-components";

const StickyStack = styled(Stack)`
  position: sticky;
  bottom: 0;
  background-color: #fff;
`;

const emptyToUndefined = (value) => {
  if (value === "") return undefined;
  if (Array.isArray(value)) return value.map(emptyToUndefined);
  if (value && typeof value === "object" && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, v]) => [key, emptyToUndefined(v)])
    );
  }
  return value;
}

const formikStyleResolver = (schema) => async (values, context, options) => {
  const result = await yupResolver(schema)(emptyToUndefined(values), context, options);
  return Object.keys(result.errors).length ? result : { values, errors: {} };
};

const FormSheet = ({
  children,
  title,
  initialValues,
  validationSchema,
  show = false,
  onClose,
  onSubmit,
  ...props
}) => {
  const methods = useForm({
    values: initialValues,
    resolver: validationSchema && formikStyleResolver(validationSchema),
    mode: "all",
  });
  const { handleSubmit, reset, formState: { isDirty } } = methods;
  const handleSave = handleSubmit(onSubmit);
  const handleClose = () => {
    reset(initialValues);
    onClose?.();
  };
  const handleSaveClose = handleSubmit(async (values) => {
    await onSubmit(values);
    handleClose();
  });

  return (
    <SettingsModal title={title} show={show} onClose={handleClose} {...props}>
      <FormProvider {...methods}>
        <form onSubmit={e => { e.preventDefault(); }}>
          {children({ ...methods })}
          {isDirty && (
            <StickyStack direction="horizontal" gap={2}>
              <SubmitButton title="Save" onClick={handleSave} />
              <SubmitButton title="Save & Close" onClick={handleSaveClose} />
            </StickyStack>
          )}
        </form>
      </FormProvider>
    </SettingsModal>
  );
};

FormSheet.propTypes = {
  children: PropTypes.func.isRequired,
  title: PropTypes.string,
  initialValues: PropTypes.object,
  validationSchema: PropTypes.object,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
  show: PropTypes.bool,
};

export default FormSheet;
