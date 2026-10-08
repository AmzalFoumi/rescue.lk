import { describe, beforeEach, it, expect, vi } from 'vitest';
import { HazardReportsController } from './hazard-reports.controller.js';
import type { HazardReportSubmissionService } from './hazard-report-submission.service.js';
import type { HazardReportVerificationService } from './hazard-report-verification.service.js';
import type { SubmitHazardReportDto } from './dto/submit-hazard-report.dto.js';

// The controller only passes requests to the services, so both are mocks here.
describe('HazardReportsController', () => {
  let controller: HazardReportsController;
  const submissionService = {
    submit: vi.fn().mockResolvedValue({ id: 'r1' }),
    queueOffline: vi
      .fn()
      .mockReturnValue({ status: 'pending_synchronisation', pendingCount: 1 }),
    syncQueued: vi.fn().mockResolvedValue({ synced: 1, stillQueued: 0 }),
  };
  const verificationService = {
    listPending: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue({ id: 'r1' }),
    verify: vi.fn().mockResolvedValue({ id: 'r1' }),
    reject: vi.fn().mockResolvedValue({ id: 'r1' }),
  };
  const dto = { description: 'x' } as SubmitHazardReportDto;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new HazardReportsController(
      submissionService as unknown as HazardReportSubmissionService,
      verificationService as unknown as HazardReportVerificationService,
    );
  });

  it('returns health status', () => {
    expect(controller.health()).toEqual({
      status: 'ok',
      module: 'hazard-reports',
    });
  });

  it('submits a report', async () => {
    await controller.submit(dto);
    expect(submissionService.submit).toHaveBeenCalledWith(dto);
  });

  it('queues a report offline', () => {
    controller.queueOffline(dto);
    expect(submissionService.queueOffline).toHaveBeenCalledWith(dto);
  });

  it('syncs queued reports', async () => {
    await controller.sync();
    expect(submissionService.syncQueued).toHaveBeenCalled();
  });

  it('lists pending reports', async () => {
    await controller.listPending();
    expect(verificationService.listPending).toHaveBeenCalled();
  });

  it('gets one report', async () => {
    await controller.getById('r1');
    expect(verificationService.getById).toHaveBeenCalledWith('r1');
  });

  it('verifies a report', async () => {
    await controller.verify('r1', { operatorId: 'op-1' });
    expect(verificationService.verify).toHaveBeenCalledWith('r1', 'op-1');
  });

  it('rejects a report with a reason', async () => {
    await controller.reject('r1', { operatorId: 'op-1', reason: 'fake' });
    expect(verificationService.reject).toHaveBeenCalledWith(
      'r1',
      'op-1',
      'fake',
    );
  });
});
