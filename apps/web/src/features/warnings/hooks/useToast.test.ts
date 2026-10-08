import { act, renderHook } from '@testing-library/react';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import { TOAST_DURATION_MS } from '../constants';
import { useToast } from './useToast';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a message, then hides it after a while', () => {
    const { result } = renderHook(() => useToast());

    act(() => result.current.show('Draft saved.'));
    expect(result.current.message).toBe('Draft saved.');

    act(() => vi.advanceTimersByTime(TOAST_DURATION_MS));
    expect(result.current.message).toBeNull();
  });

  it('restarts the timer for a newer message', () => {
    const { result } = renderHook(() => useToast());
    act(() => result.current.show('First'));
    act(() => vi.advanceTimersByTime(TOAST_DURATION_MS - 1));

    act(() => result.current.show('Second'));
    act(() => vi.advanceTimersByTime(TOAST_DURATION_MS - 1));

    expect(result.current.message).toBe('Second');
  });

  it('can be dismissed', () => {
    const { result } = renderHook(() => useToast());
    act(() => result.current.show('Hi'));

    act(() => result.current.dismiss());

    expect(result.current.message).toBeNull();
  });
});
