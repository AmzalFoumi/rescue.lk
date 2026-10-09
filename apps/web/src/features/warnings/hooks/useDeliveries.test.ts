import { act, renderHook } from '@testing-library/react';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import type { DeliveryRecordDto, DeliveryStatus } from '@rescue-lk/shared';
import { api } from '@/lib/api';
import { DELIVERY_POLL_INTERVAL_MS } from '../constants';
import { useDeliveries } from './useDeliveries';

vi.mock('@/lib/api', () => ({
  api: { warnings: { deliveries: vi.fn() } },
}));

const deliveriesApi = vi.mocked(api.warnings.deliveries);
const WARNING_ID = '665f1b2c9d3e4a0012345670';

const record = (status: DeliveryStatus): DeliveryRecordDto => ({
  id: `record-${status}`,
  warningId: WARNING_ID,
  warningVersion: 1,
  channel: 'SMS',
  status,
  attempts: 1,
  recipients: 0,
  lastAttemptAt: null,
  error: '',
});

// Lets pending promises and the React updates they trigger settle.
const flush = () => act(async () => {});

describe('useDeliveries', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    deliveriesApi.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('loads nothing without a warning', async () => {
    const { result } = renderHook(() => useDeliveries(null));
    await flush();

    expect(deliveriesApi).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
  });

  it('loads the deliveries of the warning', async () => {
    deliveriesApi.mockResolvedValue([record('SENT')]);

    const { result } = renderHook(() => useDeliveries(WARNING_ID));
    await flush();

    expect(deliveriesApi).toHaveBeenCalledWith(WARNING_ID);
    expect(result.current.data).toEqual([record('SENT')]);
  });

  it.each(['QUEUED', 'RETRYING'] as const)(
    'polls while a record is %s and stops once all are final',
    async (inProgress) => {
      deliveriesApi
        .mockResolvedValueOnce([record(inProgress)])
        .mockResolvedValueOnce([record('SENT')]);
      const { result } = renderHook(() => useDeliveries(WARNING_ID));
      await flush();
      expect(deliveriesApi).toHaveBeenCalledTimes(1);

      await act(() => vi.advanceTimersByTimeAsync(DELIVERY_POLL_INTERVAL_MS));

      expect(deliveriesApi).toHaveBeenCalledTimes(2);
      expect(result.current.data).toEqual([record('SENT')]);

      await act(() =>
        vi.advanceTimersByTimeAsync(DELIVERY_POLL_INTERVAL_MS * 3),
      );
      expect(deliveriesApi).toHaveBeenCalledTimes(2);
    },
  );

  it('does not poll when every record is final', async () => {
    deliveriesApi.mockResolvedValue([record('SENT'), record('FAILED')]);
    renderHook(() => useDeliveries(WARNING_ID));
    await flush();

    await act(() => vi.advanceTimersByTimeAsync(DELIVERY_POLL_INTERVAL_MS * 3));

    expect(deliveriesApi).toHaveBeenCalledTimes(1);
  });

  it('stops polling when unmounted', async () => {
    deliveriesApi.mockResolvedValue([record('QUEUED')]);
    const { unmount } = renderHook(() => useDeliveries(WARNING_ID));
    await flush();

    unmount();
    await act(() => vi.advanceTimersByTimeAsync(DELIVERY_POLL_INTERVAL_MS * 3));

    expect(deliveriesApi).toHaveBeenCalledTimes(1);
  });
});
