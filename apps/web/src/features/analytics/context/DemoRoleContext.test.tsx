import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { DemoRoleProvider, useDemoRole } from './DemoRoleContext';

describe('DemoRoleContext', () => {
  it('throws when used outside the provider', () => {
    // Suppress console.error for expected throw
    const originalError = console.error;
    console.error = () => {};

    expect(() => renderHook(() => useDemoRole())).toThrow(
      'useDemoRole must be used inside DemoRoleProvider',
    );

    console.error = originalError;
  });

  it('provides the default role', () => {
    const { result } = renderHook(() => useDemoRole(), {
      wrapper: DemoRoleProvider,
    });
    expect(result.current.role).toBe('DMC_ADMIN');
  });

  it('setRole updates consumers', () => {
    const { result } = renderHook(() => useDemoRole(), {
      wrapper: DemoRoleProvider,
    });

    act(() => {
      result.current.setRole('DONOR_ORGANISATION');
    });

    expect(result.current.role).toBe('DONOR_ORGANISATION');
  });
});
