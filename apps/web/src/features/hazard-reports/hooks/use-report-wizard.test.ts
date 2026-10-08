import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useReportWizard } from './use-report-wizard';

describe('useReportWizard', () => {
  it('starts on step 1 with an empty draft', () => {
    const { result } = renderHook(() => useReportWizard());
    expect(result.current.state.step).toBe(1);
    expect(result.current.state.draft.hazardType).toBeNull();
  });

  it('moves through the steps with the ready-made actions', () => {
    const { result } = renderHook(() => useReportWizard());

    act(() => result.current.next());
    expect(result.current.state.errors.hazardType).toBeDefined();

    act(() => result.current.change({ hazardType: 'fire' }));
    act(() => result.current.next());
    expect(result.current.state.step).toBe(2);

    act(() => result.current.back());
    expect(result.current.state.step).toBe(1);

    act(() => result.current.goTo(3));
    expect(result.current.state.step).toBe(3);

    act(() => result.current.checkAll());
    expect(result.current.state.step).toBe(2);

    act(() => result.current.reset());
    expect(result.current.state.step).toBe(1);
    expect(result.current.state.draft.hazardType).toBeNull();
  });
});
