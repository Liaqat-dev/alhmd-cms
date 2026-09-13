import { useState } from 'react';
import { useFormik } from 'formik';

/**
 * Parses a backend API error into field errors + a general error string.
 *
 * Backend AppError format:
 *   { errors: { field: "message", ..., message: "general" } }
 *   { errors: { message: "general" } }
 *
 * The key "message" inside errors is treated as a general (non-field) error.
 * All other keys are mapped directly to formik field names.
 */
const parseApiError = (err) => {
  const data = err?.response?.data;

  if (!data) {
    return { fieldErrors: {}, general: 'Something went wrong. Please try again.' };
  }

  if (data.errors && typeof data.errors === 'object') {
    const { message: general, ...fieldErrors } = data.errors;
    return {
      fieldErrors,
      general:
        general ||
        (Object.keys(fieldErrors).length === 0
          ? 'Something went wrong. Please try again.'
          : ''),
    };
  }

  return {
    fieldErrors: {},
    general: data.message || 'Something went wrong. Please try again.',
  };
};

/**
 * useAppForm — Formik wrapper with automatic backend error mapping.
 *
 * Usage:
 *   const { formik, serverError, clearServerError, isSubmitting } = useAppForm({
 *     initialValues: { email: '', password: '' },
 *     validationSchema: Yup.object({ ... }),   // optional
 *     onSubmit: async (values) => {
 *       const { data } = await authAPI.login(values);
 *       return data;
 *     },
 *     onSuccess: (responseData) => { navigate('/dashboard') },
 *   });
 *
 * Backend field errors are mapped automatically to formik.errors.
 * General (non-field) errors are exposed as `serverError`.
 *
 * Options:
 *   validateOnChange   — default false (validate on blur only for cleaner UX)
 *   validateOnBlur     — default true
 */
const useAppForm = ({
  initialValues,
  validationSchema,
  onSubmit,
  onSuccess,
  validateOnChange = false,
  validateOnBlur = true,
}) => {
  const [serverError, setServerError] = useState('');

  const formik = useFormik({
    initialValues,
    validationSchema,
    validateOnChange,
    validateOnBlur,
    onSubmit: async (values, { setErrors }) => {
      setServerError('');
      try {
        const result = await onSubmit(values);
        if (onSuccess) onSuccess(result);
      } catch (err) {
        const { fieldErrors, general } = parseApiError(err);
        if (Object.keys(fieldErrors).length > 0) setErrors(fieldErrors);
        if (general) setServerError(general);
      }
    },
  });

  return {
    formik,
    isSubmitting: formik.isSubmitting,
    serverError,
    clearServerError: () => setServerError(''),
  };
};

export default useAppForm;
