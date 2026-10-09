import { act, renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EMPTY_FORM } from '../form';
import { useWarningForm } from './useWarningForm';

describe('useWarningForm', () => {
  it('edits one field at a time', () => {
    const { result } = renderHook(() => useWarningForm());

    act(() => result.current.setField('message', 'Rising water'));

    expect(result.current.values).toEqual({
      ...EMPTY_FORM,
      message: 'Rising water',
    });
  });

  it('keeps per-field errors and clears one when its field is edited', () => {
    const { result } = renderHook(() => useWarningForm());
    act(() =>
      result.current.setErrors({ hazard: 'Choose.', severity: 'Choose.' }),
    );

    act(() => result.current.setField('hazard', 'flood'));

    expect(result.current.errors).toEqual({ severity: 'Choose.' });
  });

  it('starts clean when a warning is loaded or the form is reset', () => {
    const { result } = renderHook(() => useWarningForm());
    act(() => result.current.setErrors({ hazard: 'Choose.' }));

    act(() => result.current.load({ ...EMPTY_FORM, message: 'Loaded' }));
    expect(result.current.errors).toEqual({});
    expect(result.current.values.message).toBe('Loaded');

    act(() => result.current.setErrors({ hazard: 'Choose.' }));
    act(() => result.current.reset());
    expect(result.current).toMatchObject({ values: EMPTY_FORM, errors: {} });
  });

  it('replaces the whole form, e.g. after choosing a source report', () => {
    const { result } = renderHook(() => useWarningForm());
    act(() => result.current.setErrors({ sourceReportId: 'Select.' }));

    act(() =>
      result.current.update((values) => ({ ...values, sourceReportId: 'r1' })),
    );

    expect(result.current.values.sourceReportId).toBe('r1');
    expect(result.current.errors).toEqual({});
  });
});
