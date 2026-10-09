import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useVisibleReportTypes } from './useVisibleReportTypes';
import { getVisibleReportTypes } from '@/lib/api';
import { useDemoRole } from '../context/DemoRoleContext';

vi.mock('@/lib/api', () => ({
  getVisibleReportTypes: vi.fn(),
}));

vi.mock('../context/DemoRoleContext', () => ({
  useDemoRole: vi.fn(),
}));

describe('useVisibleReportTypes', () => {
  beforeEach(() => {
    vi.mocked(useDemoRole).mockReturnValue({
      role: 'DMC_ADMIN',
      setRole: vi.fn(),
    });
    vi.mocked(getVisibleReportTypes).mockResolvedValue([
      'CITIZENS_REACHED',
      'ALERT_TIMELINE',
    ] as unknown as ReportType[]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads types for the role', async () => {
    const { result } = renderHook(() => useVisibleReportTypes());

    expect(result.current).toEqual([]);

    await waitFor(() => {
      expect(result.current).toEqual(['CITIZENS_REACHED', 'ALERT_TIMELINE']);
    });

    expect(getVisibleReportTypes).toHaveBeenCalledWith('DMC_ADMIN');
  });

  it('reloads when the role changes', async () => {
    const { result, rerender } = renderHook(() => useVisibleReportTypes());

    await waitFor(() => {
      expect(result.current).toEqual(['CITIZENS_REACHED', 'ALERT_TIMELINE']);
    });

    vi.mocked(useDemoRole).mockReturnValue({
      role: 'DONOR_ORGANISATION',
      setRole: vi.fn(),
    });
    vi.mocked(getVisibleReportTypes).mockResolvedValue([
      'CITIZENS_REACHED',
    ] as unknown as ReportType[]);

    rerender();

    await waitFor(() => {
      expect(result.current).toEqual(['CITIZENS_REACHED']);
    });

    expect(getVisibleReportTypes).toHaveBeenCalledWith('DONOR_ORGANISATION');
  });

  it('returns [] on error', async () => {
    vi.mocked(getVisibleReportTypes).mockRejectedValue(
      new Error('Failed to fetch'),
    );
    const { result } = renderHook(() => useVisibleReportTypes());

    await waitFor(() => {
      expect(result.current).toEqual([]);
    });
  });

  it('ignores a stale response after unmount', async () => {
    let resolvePromise: (v: unknown) => void;
    const promise = new Promise<unknown>((resolve) => {
      resolvePromise = resolve;
    });

    vi.mocked(getVisibleReportTypes).mockReturnValue(promise);

    const { result, unmount } = renderHook(() => useVisibleReportTypes());

    unmount();
    resolvePromise!(['CITIZENS_REACHED']);

    // Wait a bit to ensure the state update is not applied. If it were, React would throw an error about unmounted component update.
    await new Promise((r) => setTimeout(r, 10));

    expect(result.current).toEqual([]);
  });

  it('ignores a rejection after unmount', async () => {
    let rejectPromise: (e: unknown) => void;
    const promise = new Promise<unknown>((_, reject) => {
      rejectPromise = reject;
    });

    vi.mocked(getVisibleReportTypes).mockReturnValue(promise);

    const { result, unmount } = renderHook(() => useVisibleReportTypes());

    unmount();
    rejectPromise!(new Error('Failed'));

    await new Promise((r) => setTimeout(r, 10));

    expect(result.current).toEqual([]);
  });
});
