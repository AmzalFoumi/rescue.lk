import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api';
import { useAsyncData } from './use-async-data';

describe('useAsyncData', () => {
  it('starts loading, then gives the data', async () => {
    const load = vi.fn().mockResolvedValue(['a']);
    const { result } = renderHook(() => useAsyncData(load));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(['a']);
    expect(result.current.error).toBeNull();
  });

  it('gives a readable error when loading fails', async () => {
    const load = vi
      .fn()
      .mockRejectedValue(new ApiError(500, ['Server problem']));
    const { result } = renderHook(() => useAsyncData(load));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Server problem');
    expect(result.current.data).toBeNull();
  });

  it('loads again on reload and clears the old error', async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error('first'))
      .mockResolvedValueOnce('second');
    const { result } = renderHook(() => useAsyncData(load));
    await waitFor(() => expect(result.current.error).toBe('first'));

    act(() => result.current.reload());
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();

    await waitFor(() => expect(result.current.data).toBe('second'));
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('ignores an answer that arrives after the screen closed', async () => {
    let finish: (value: string) => void = () => {};
    const load = vi.fn(
      () => new Promise<string>((resolve) => (finish = resolve)),
    );
    const { result, unmount } = renderHook(() => useAsyncData(load));

    unmount();
    finish('late');
    await Promise.resolve();

    expect(result.current.data).toBeNull();
  });
});
