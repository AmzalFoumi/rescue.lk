import { renderHook, waitFor } from '@testing-library/react';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import type { DeliveryRecordDto } from '@rescue-lk/shared';
import { api } from '@/lib/api';
import { useDeliveriesByWarning } from './useDeliveriesByWarning';

vi.mock('@/lib/api', () => ({
  api: { warnings: { deliveries: vi.fn() } },
}));

const deliveriesApi = vi.mocked(api.warnings.deliveries);

const recordFor = (warningId: string): DeliveryRecordDto => ({
  id: `record-${warningId}`,
  warningId,
  warningVersion: 1,
  channel: 'SMS',
  status: 'SENT',
  attempts: 1,
  recipients: 1,
  lastAttemptAt: null,
  error: '',
});

describe('useDeliveriesByWarning', () => {
  beforeEach(() => {
    deliveriesApi.mockReset();
    deliveriesApi.mockImplementation((id) => Promise.resolve([recordFor(id)]));
  });

  it('loads the latest deliveries of every listed warning, keyed by warning', async () => {
    const { result } = renderHook(() => useDeliveriesByWarning(['w1', 'w2']));

    await waitFor(() =>
      expect(result.current.data).toEqual({
        w1: [recordFor('w1')],
        w2: [recordFor('w2')],
      }),
    );
  });

  it('asks nothing for an empty list', () => {
    const { result } = renderHook(() => useDeliveriesByWarning([]));

    expect(deliveriesApi).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
  });
});
