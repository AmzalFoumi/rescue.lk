import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { SubmitHazardReportRequest } from '@rescue-lk/shared';
import { useReporting } from '../state/reporting-context';
import {
  fakeHazardReportsApi,
  reportingWrapper,
  sampleReport,
} from '../testing/test-support';
import { useSubmitReport } from './use-submit-report';

const request = { description: 'Water is rising' } as SubmitHazardReportRequest;

function setup(api = fakeHazardReportsApi()) {
  const { Wrapper } = reportingWrapper({ hazardReports: api });
  return {
    api,
    ...renderHook(
      () => ({ submit: useSubmitReport(), reporting: useReporting() }),
      { wrapper: Wrapper },
    ),
  };
}

describe('useSubmitReport', () => {
  it('sends the report when the network is on', async () => {
    const report = sampleReport({ id: 'abc' });
    const { api, result } = setup(
      fakeHazardReportsApi({ submit: vi.fn().mockResolvedValue(report) }),
    );

    let outcome;
    await act(async () => {
      outcome = await result.current.submit(request);
    });

    expect(api.submit).toHaveBeenCalledWith(request);
    expect(outcome).toEqual({ kind: 'sent', report });
    expect(api.queueOffline).not.toHaveBeenCalled();
  });

  it('puts the report in the offline queue when the network is off, and keeps a copy', async () => {
    const { api, result } = setup();
    act(() => result.current.reporting.setOnline(false));

    let outcome;
    await act(async () => {
      outcome = await result.current.submit(request);
    });

    expect(api.queueOffline).toHaveBeenCalledWith(request);
    expect(api.submit).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({ kind: 'queued', pendingCount: 1 });
    await waitFor(() =>
      expect(result.current.reporting.queue.queued).toHaveLength(1),
    );
  });

  it('passes an API error on to the caller', async () => {
    const { result } = setup(
      fakeHazardReportsApi({
        submit: vi.fn().mockRejectedValue(new Error('boom')),
      }),
    );
    await expect(result.current.submit(request)).rejects.toThrow('boom');
  });
});
