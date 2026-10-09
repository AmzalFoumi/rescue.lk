import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ApiError } from '@/lib/api-error';
import { useAsyncResource } from './useAsyncResource';

describe('useAsyncResource', () => {
  it('starts loading, then exposes the data', async () => {
    const load = vi.fn().mockResolvedValue(['a']);

    const { result } = renderHook(() => useAsyncResource(load));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(['a']);
    expect(result.current.error).toBeNull();
  });

  it('records when the data last arrived', async () => {
    const load = vi.fn().mockResolvedValue(['a']);

    const { result } = renderHook(() => useAsyncResource(load));

    expect(result.current.updatedAt).toBeNull();
    await waitFor(() => expect(result.current.updatedAt).toBeInstanceOf(Date));
  });

  it('exposes a failure as an ApiError', async () => {
    const failure = new ApiError({ status: 404, message: 'Not found' });
    const load = vi.fn().mockRejectedValue(failure);

    const { result } = renderHook(() => useAsyncResource(load));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(failure);
    expect(result.current.data).toBeNull();
  });

  it('wraps an unexpected failure in an ApiError', async () => {
    const load = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    const { result } = renderHook(() => useAsyncResource(load));

    await waitFor(() => expect(result.current.error).toBeInstanceOf(ApiError));
  });

  it('reload loads again and keeps the old data while it does', async () => {
    let resolveSecond: (value: string[]) => void = () => undefined;
    const load = vi
      .fn()
      .mockResolvedValueOnce(['first'])
      .mockReturnValueOnce(
        new Promise<string[]>((resolve) => {
          resolveSecond = resolve;
        }),
      );
    const { result } = renderHook(() => useAsyncResource(load));
    await waitFor(() => expect(result.current.data).toEqual(['first']));

    act(() => result.current.reload());

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toEqual(['first']);
    await act(async () => resolveSecond(['second']));
    expect(result.current.data).toEqual(['second']);
    expect(result.current.loading).toBe(false);
  });

  it('clears an earlier error after a successful reload', async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(new ApiError({ status: 500, message: 'down' }))
      .mockResolvedValueOnce(['ok']);
    const { result } = renderHook(() => useAsyncResource(load));
    await waitFor(() => expect(result.current.error).not.toBeNull());

    act(() => result.current.reload());

    await waitFor(() => expect(result.current.data).toEqual(['ok']));
    expect(result.current.error).toBeNull();
  });

  it('does nothing without a loader', () => {
    const { result } = renderHook(() => useAsyncResource<string[]>(null));

    expect(result.current).toMatchObject({
      data: null,
      error: null,
      loading: false,
    });
  });

  it('ignores a result that arrives after unmounting', async () => {
    let resolve: (value: string[]) => void = () => undefined;
    const load = vi.fn(
      () =>
        new Promise<string[]>((done) => {
          resolve = done;
        }),
    );
    const { result, unmount } = renderHook(() => useAsyncResource(load));

    unmount();
    await act(async () => resolve(['late']));

    expect(result.current.data).toBeNull();
  });
});
