import { describe, beforeEach, it, expect, vi } from 'vitest';
import type { DispatchesRepository } from './dispatches.repository.interface.js';
import {
  REPORT_ID,
  fakeDispatchesRepository,
  fakeVerifiedReports,
  verifiedReport,
} from './response.test-data.js';
import { ResponseTargetsService } from './response-targets.service.js';
import type { VerifiedReportsPort } from './verified-reports.port.js';

describe('ResponseTargetsService', () => {
  let service: ResponseTargetsService;
  let verifiedReports: VerifiedReportsPort;
  let dispatches: DispatchesRepository;

  beforeEach(() => {
    verifiedReports = fakeVerifiedReports();
    dispatches = fakeDispatchesRepository();
    service = new ResponseTargetsService(verifiedReports, dispatches);
  });

  it('marks a report with no teams as needing a response', async () => {
    const [target] = await service.list();

    expect(target.dispatchedTeams).toBe(0);
    expect(target.needsResponse).toBe(true);
  });

  it('counts the teams already working on a report', async () => {
    vi.mocked(dispatches.countByReport).mockResolvedValue({ [REPORT_ID]: 2 });

    const [target] = await service.list();

    expect(target.dispatchedTeams).toBe(2);
    expect(target.needsResponse).toBe(false);
  });

  it('asks for the counts of exactly the reports it listed', async () => {
    vi.mocked(verifiedReports.findVerified).mockResolvedValue([
      verifiedReport(),
      verifiedReport({ id: 'report-2' }),
    ]);

    await service.list();

    expect(dispatches.countByReport).toHaveBeenCalledWith([
      REPORT_ID,
      'report-2',
    ]);
  });

  it('returns nothing when no report is verified', async () => {
    vi.mocked(verifiedReports.findVerified).mockResolvedValue([]);

    expect(await service.list()).toEqual([]);
  });
});
