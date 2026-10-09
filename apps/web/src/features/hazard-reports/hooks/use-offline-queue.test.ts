import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { SubmitHazardReportRequest } from '@rescue-lk/shared';
import type { HazardReportsApi } from '../api/hazard-reports-api';
import { useOfflineQueue } from './use-offline-queue';

const request = { description: 'Water is rising' } as SubmitHazardReportRequest;
const entry = { request, savedAt: '2026-10-08T10:00:00.000Z' };

function fakeApi(
  sync = vi.fn().mockResolvedValue({ synced: 0, stillQueued: 0 }),
) {
  return { sync } as unknown as HazardReportsApi;
}

describe('useOfflineQueue', () => {
  it('saves reports with their own local ids', () => {
    const { result } = renderHook(() => useOfflineQueue(fakeApi(), false));

    act(() => {
      result.current.save(entry);
      result.current.save(entry);
    });

    expect(result.current.queued.map((item) => item.localId)).toEqual([
      'local-1',
      'local-2',
    ]);
  });

  it('sends the saved reports once when the network comes back, then empties the queue', async () => {
    const sync = vi.fn().mockResolvedValue({ synced: 1, stillQueued: 0 });
    const { result, rerender } = renderHook(
      ({ online }) => useOfflineQueue(fakeApi(sync), online),
      {
        initialProps: { online: false },
      },
    );
    act(() => {
      result.current.save(entry);
    });

    rerender({ online: true });

    await waitFor(() =>
      expect(result.current.syncState).toEqual({
        phase: 'done',
        synced: 1,
        stillQueued: 0,
      }),
    );
    expect(sync).toHaveBeenCalledTimes(1);
    expect(result.current.queued).toEqual([]);
  });

  it('shows "syncing" with the number of saved reports while sending', async () => {
    let finish: (value: {
      synced: number;
      stillQueued: number;
    }) => void = () => {};
    const sync = vi.fn(
      () =>
        new Promise<{ synced: number; stillQueued: number }>(
          (resolve) => (finish = resolve),
        ),
    );
    const { result, rerender } = renderHook(
      ({ online }) => useOfflineQueue(fakeApi(sync), online),
      {
        initialProps: { online: false },
      },
    );
    act(() => {
      result.current.save(entry);
      result.current.save(entry);
    });

    rerender({ online: true });
    await waitFor(() =>
      expect(result.current.syncState).toEqual({ phase: 'syncing', count: 2 }),
    );

    await act(async () => finish({ synced: 2, stillQueued: 0 }));
  });

  it('keeps the reports that could not be sent', async () => {
    const sync = vi.fn().mockResolvedValue({ synced: 1, stillQueued: 1 });
    const { result, rerender } = renderHook(
      ({ online }) => useOfflineQueue(fakeApi(sync), online),
      {
        initialProps: { online: false },
      },
    );
    act(() => {
      result.current.save(entry);
      result.current.save(entry);
    });

    rerender({ online: true });

    await waitFor(() =>
      expect(result.current.syncState).toEqual({
        phase: 'done',
        synced: 1,
        stillQueued: 1,
      }),
    );
    expect(result.current.queued).toHaveLength(1);
  });

  it('does not call the server when there is nothing saved', () => {
    const sync = vi.fn();
    const { rerender } = renderHook(
      ({ online }) => useOfflineQueue(fakeApi(sync), online),
      {
        initialProps: { online: false },
      },
    );

    rerender({ online: true });

    expect(sync).not.toHaveBeenCalled();
  });

  it('does not send again while it stays online', async () => {
    const sync = vi.fn().mockResolvedValue({ synced: 0, stillQueued: 0 });
    const { result, rerender } = renderHook(
      ({ online }) => useOfflineQueue(fakeApi(sync), online),
      {
        initialProps: { online: true },
      },
    );

    act(() => {
      result.current.save(entry);
    });
    rerender({ online: true });

    expect(sync).not.toHaveBeenCalled();
  });

  it('shows an error when sending fails, and syncNow tries again', async () => {
    const sync = vi
      .fn()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce({ synced: 1, stillQueued: 0 });
    const { result, rerender } = renderHook(
      ({ online }) => useOfflineQueue(fakeApi(sync), online),
      {
        initialProps: { online: false },
      },
    );
    act(() => {
      result.current.save(entry);
    });

    rerender({ online: true });
    await waitFor(() =>
      expect(result.current.syncState).toEqual({
        phase: 'error',
        message: 'network down',
      }),
    );
    expect(result.current.queued).toHaveLength(1);

    await act(async () => {
      await result.current.syncNow();
    });
    expect(result.current.syncState).toEqual({
      phase: 'done',
      synced: 1,
      stillQueued: 0,
    });
  });

  it('hides the sync message on dismiss', async () => {
    const sync = vi.fn().mockResolvedValue({ synced: 1, stillQueued: 0 });
    const { result, rerender } = renderHook(
      ({ online }) => useOfflineQueue(fakeApi(sync), online),
      {
        initialProps: { online: false },
      },
    );
    act(() => {
      result.current.save(entry);
    });
    rerender({ online: true });
    await waitFor(() => expect(result.current.syncState.phase).toBe('done'));

    act(() => result.current.dismissSync());

    expect(result.current.syncState).toEqual({ phase: 'idle' });
  });
});
