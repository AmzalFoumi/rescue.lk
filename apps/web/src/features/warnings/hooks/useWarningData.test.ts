import { renderHook, waitFor } from '@testing-library/react';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { api } from '@/lib/api';
import { useWarnings } from './useWarnings';
import { useVerifiedReports } from './useVerifiedReports';
import { useTargetAreas } from './useTargetAreas';

vi.mock('@/lib/api', () => ({
  api: {
    warnings: {
      list: vi.fn(),
      verifiedReports: vi.fn(),
      targetAreas: vi.fn(),
    },
  },
}));

const warningsApi = vi.mocked(api.warnings);

describe('warning data hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    warningsApi.list.mockResolvedValue([]);
    warningsApi.verifiedReports.mockResolvedValue([]);
    warningsApi.targetAreas.mockResolvedValue([]);
  });

  it('useWarnings loads every warning when no status is given', async () => {
    const { result } = renderHook(() => useWarnings());

    await waitFor(() => expect(result.current.data).toEqual([]));
    expect(warningsApi.list).toHaveBeenCalledWith(undefined);
  });

  it('useWarnings reloads when the status filter changes', async () => {
    const { result, rerender } = renderHook(
      ({ status }: { status?: 'DRAFT' | 'ACTIVE' }) => useWarnings(status),
      { initialProps: { status: 'DRAFT' } },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    rerender({ status: 'ACTIVE' });

    await waitFor(() =>
      expect(warningsApi.list).toHaveBeenLastCalledWith('ACTIVE'),
    );
  });

  it('useVerifiedReports loads the verified reports', async () => {
    const { result } = renderHook(() => useVerifiedReports());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(warningsApi.verifiedReports).toHaveBeenCalledTimes(1);
  });

  it('useTargetAreas loads the target areas', async () => {
    const { result } = renderHook(() => useTargetAreas());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(warningsApi.targetAreas).toHaveBeenCalledTimes(1);
  });
});
