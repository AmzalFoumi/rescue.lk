import { renderHook, waitFor } from '@testing-library/react';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { api } from '@/lib/api';
import { useReachEstimate } from './useReachEstimate';

vi.mock('@/lib/api', () => ({
  api: { warnings: { reach: vi.fn() } },
}));

const reachApi = vi.mocked(api.warnings.reach);
const estimate = {
  districts: ['Ratnapura', 'Kalutara'],
  channels: [{ channel: 'SMS' as const, recipients: 240000 }],
};

describe('useReachEstimate', () => {
  beforeEach(() => {
    reachApi.mockReset();
    reachApi.mockResolvedValue(estimate);
  });

  it('asks nothing while no area is selected', () => {
    const { result } = renderHook(() => useReachEstimate([]));

    expect(reachApi).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
  });

  it('estimates the selected areas', async () => {
    const { result } = renderHook(() => useReachEstimate(['B-KALU']));

    await waitFor(() => expect(result.current.data).toEqual(estimate));
    expect(reachApi).toHaveBeenCalledWith(['B-KALU']);
  });

  it('asks again only when the selection really changes', async () => {
    const { rerender } = renderHook(
      ({ ids }: { ids: string[] }) => useReachEstimate(ids),
      { initialProps: { ids: ['B-KALU'] } },
    );
    await waitFor(() => expect(reachApi).toHaveBeenCalledTimes(1));

    rerender({ ids: ['B-KALU'] });
    rerender({ ids: ['B-KALU', 'D-COLOMBO'] });

    await waitFor(() => expect(reachApi).toHaveBeenCalledTimes(2));
    expect(reachApi).toHaveBeenLastCalledWith(['B-KALU', 'D-COLOMBO']);
  });
});
