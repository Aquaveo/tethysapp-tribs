import { render } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

// Renders form inputs inside a form, so tests don't depend on the form library.
// Validates on change and on blur, like Formik did by default.
const TestForm = ({ children, initialValues, validationSchema }) => {
  const methods = useForm({
    defaultValues: initialValues,
    resolver: validationSchema && yupResolver(validationSchema),
    mode: "all",
  });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

export const renderWithForm = (ui, { initialValues = {}, validationSchema } = {}) =>
  render(
    <TestForm initialValues={initialValues} validationSchema={validationSchema}>
      {ui}
    </TestForm>
  );
