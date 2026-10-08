import { useCallback, useState } from 'react';
import type { WarningFormErrors } from '@rescue-lk/shared';
import { EMPTY_FORM, type WarningFormValues } from '../form';

export type SetFormField = <K extends keyof WarningFormValues>(
  field: K,
  value: WarningFormValues[K],
) => void;

interface FormState {
  values: WarningFormValues;
  // One message per invalid field, from step checks or from the API.
  errors: WarningFormErrors;
}

const CLEAN: FormState = { values: EMPTY_FORM, errors: {} };

// State of the warning form. Editing a field clears that field's error;
// loading, replacing or resetting the form clears them all.
export function useWarningForm() {
  const [state, setState] = useState<FormState>(CLEAN);

  const setField: SetFormField = useCallback((field, value) => {
    setState(({ values, errors }) => {
      const remaining = { ...errors };
      delete remaining[field];
      return { values: { ...values, [field]: value }, errors: remaining };
    });
  }, []);

  const update = useCallback(
    (change: (values: WarningFormValues) => WarningFormValues) =>
      setState(({ values }) => ({ values: change(values), errors: {} })),
    [],
  );

  const load = useCallback(
    (values: WarningFormValues) => setState({ values, errors: {} }),
    [],
  );
  const reset = useCallback(() => setState(CLEAN), []);
  const setErrors = useCallback(
    (errors: WarningFormErrors) =>
      setState((current) => ({ ...current, errors })),
    [],
  );

  return {
    values: state.values,
    errors: state.errors,
    setField,
    update,
    load,
    reset,
    setErrors,
  };
}
