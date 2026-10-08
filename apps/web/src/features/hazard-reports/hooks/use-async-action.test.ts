import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api';
import { useAsyncAction } from './use-async-action';

describe('useAsyncAction', () => {
  it('runs the action with its arguments and gives back the result', async () => {
    const action = vi.fn(async (a: number, b: number) => a + b);
    const { result } = renderHook(() => useAsyncAction(action));

    let value: number | undefined;
    await act(async () => {
      value = await result.current.run(2, 3);
    });

    expect(value).toBe(5);
    expect(result.current.pending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('is pending while the action runs', async () => {
    let finish: () => void = () => {};
    const action = vi.fn(
      () => new Promise<void>((resolve) => (finish = resolve)),
    );
    const { result } = renderHook(() => useAsyncAction(action));

    let running: Promise<unknown> = Promise.resolve();
    act(() => {
      running = result.current.run();
    });
    expect(result.current.pending).toBe(true);

    await act(async () => {
      finish();
      await running;
    });
    expect(result.current.pending).toBe(false);
  });

  it('keeps the error text and gives back undefined when the action fails', async () => {
    const action = vi
      .fn()
      .mockRejectedValue(new ApiError(409, ['Already verified']));
    const { result } = renderHook(() => useAsyncAction(action));

    let value: unknown = 'unset';
    await act(async () => {
      value = await result.current.run();
    });

    expect(value).toBeUndefined();
    expect(result.current.error).toBe('Already verified');
    expect(result.current.pending).toBe(false);
  });

  it('clears the old error when it runs again, and on clearError', async () => {
    const action = vi
      .fn()
      .mockRejectedValueOnce(new Error('first'))
      .mockResolvedValueOnce('ok');
    const { result } = renderHook(() => useAsyncAction(action));

    await act(async () => {
      await result.current.run();
    });
    expect(result.current.error).toBe('first');

    await act(async () => {
      await result.current.run();
    });
    expect(result.current.error).toBeNull();

    action.mockRejectedValueOnce(new Error('again'));
    await act(async () => {
      await result.current.run();
    });
    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });
});
