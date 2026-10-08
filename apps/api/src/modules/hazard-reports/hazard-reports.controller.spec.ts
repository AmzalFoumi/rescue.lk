import { describe, beforeEach, it, expect, vi } from 'vitest';
import { HazardReportsController } from './hazard-reports.controller.js';
import type { HazardReportsService } from './hazard-reports.service.js';
import type { SubmitHazardReportDto } from './dto/submit-hazard-report.dto.js';

// The controller only passes requests to the service, so the service is a mock here.
describe('HazardReportsController', () => {
  let controller: HazardReportsController;
  const service = {
    health: vi.fn().mockReturnValue({ status: 'ok', module: 'hazard-reports' }),
    submit: vi.fn().mockResolvedValue({ id: 'r1' }),
    queueOffline: vi
      .fn()
      .mockReturnValue({ status: 'pending_synchronisation', pendingCount: 1 }),
    syncQueued: vi.fn().mockResolvedValue({ synced: 1, stillQueued: 0 }),
    listPending: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue({ id: 'r1' }),
    verify: vi.fn().mockResolvedValue({ id: 'r1' }),
    reject: vi.fn().mockResolvedValue({ id: 'r1' }),
  };
  const dto = { description: 'x' } as SubmitHazardReportDto;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new HazardReportsController(
      service as unknown as HazardReportsService,
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
    expect(service.submit).toHaveBeenCalledWith(dto);
  });

  it('queues a report offline', () => {
    controller.queueOffline(dto);
    expect(service.queueOffline).toHaveBeenCalledWith(dto);
  });

  it('syncs queued reports', async () => {
    await controller.sync();
    expect(service.syncQueued).toHaveBeenCalled();
  });

  it('lists pending reports', async () => {
    await controller.listPending();
    expect(service.listPending).toHaveBeenCalled();
  });

  it('gets one report', async () => {
    await controller.getById('r1');
    expect(service.getById).toHaveBeenCalledWith('r1');
  });

  it('verifies a report', async () => {
    await controller.verify('r1', { operatorId: 'op-1' });
    expect(service.verify).toHaveBeenCalledWith('r1', 'op-1');
  });

  it('rejects a report with a reason', async () => {
    await controller.reject('r1', { operatorId: 'op-1', reason: 'fake' });
    expect(service.reject).toHaveBeenCalledWith('r1', 'op-1', 'fake');
  });
});
