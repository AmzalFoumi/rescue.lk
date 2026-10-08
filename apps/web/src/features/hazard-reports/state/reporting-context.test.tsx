import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { reportingWrapper } from '../testing/test-support';
import { useReporting } from './reporting-context';

describe('ReportingProvider', () => {
  const { Wrapper } = reportingWrapper();

  it('starts online with the demo citizen and operator', () => {
    const { result } = renderHook(() => useReporting(), { wrapper: Wrapper });
    expect(result.current.online).toBe(true);
    expect(result.current.reporter.name).toBe('Nimal Perera');
    expect(result.current.operator.name).toBe('K. Jayawardena');
  });

  it('switches the network off and on', () => {
    const { result } = renderHook(() => useReporting(), { wrapper: Wrapper });
    act(() => result.current.setOnline(false));
    expect(result.current.online).toBe(false);
  });

  it('refuses to be used outside the provider', () => {
    expect(() => renderHook(() => useReporting())).toThrow(
      'inside ReportingProvider',
    );
  });
});
