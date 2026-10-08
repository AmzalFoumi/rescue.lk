import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  DISTRICTS,
  fakeHazardReportsApi,
  reportingWrapper,
  sampleReport,
} from '../testing/test-support';
import {
  useDistricts,
  useDuplicateReports,
  useMyReports,
  usePendingReports,
} from './use-report-data';

describe('useDistricts', () => {
  it('loads the districts', async () => {
    const { result } = renderHook(() => useDistricts(), {
      wrapper: reportingWrapper().Wrapper,
    });
    await waitFor(() => expect(result.current.data).toEqual(DISTRICTS));
  });
});

describe('useMyReports', () => {
  it('loads the reports of the demo citizen', async () => {
    const api = fakeHazardReportsApi({
      listByReporter: vi.fn().mockResolvedValue([sampleReport()]),
    });
    const { result } = renderHook(() => useMyReports(), {
      wrapper: reportingWrapper({ hazardReports: api }).Wrapper,
    });

    await waitFor(() => expect(result.current.data).toHaveLength(1));
    expect(api.listByReporter).toHaveBeenCalledWith('citizen-nimal');
  });
});

describe('usePendingReports', () => {
  it('loads the pending reports', async () => {
    const api = fakeHazardReportsApi({
      listPending: vi.fn().mockResolvedValue([sampleReport()]),
    });
    const { result } = renderHook(() => usePendingReports(), {
      wrapper: reportingWrapper({ hazardReports: api }).Wrapper,
    });
    await waitFor(() => expect(result.current.data).toHaveLength(1));
  });
});

describe('useDuplicateReports', () => {
  it('fetches each duplicate by id', async () => {
    const api = fakeHazardReportsApi({
      getById: vi.fn(async (id: string) => sampleReport({ id })),
    });
    const { result } = renderHook(() => useDuplicateReports(['a', 'b']), {
      wrapper: reportingWrapper({ hazardReports: api }).Wrapper,
    });

    await waitFor(() =>
      expect(result.current.data?.map((report) => report.id)).toEqual([
        'a',
        'b',
      ]),
    );
  });

  it('does not call the API when there are no duplicates', async () => {
    const api = fakeHazardReportsApi();
    const { result } = renderHook(() => useDuplicateReports([]), {
      wrapper: reportingWrapper({ hazardReports: api }).Wrapper,
    });

    await waitFor(() => expect(result.current.data).toEqual([]));
    expect(api.getById).not.toHaveBeenCalled();
  });
});
