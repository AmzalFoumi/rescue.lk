import { describe, it, expect, vi } from 'vitest';
import { HazardReportTrackingService } from './hazard-report-tracking.service.js';
import { fakeRepository, storedReport } from './hazard-report.test-data.js';

describe('HazardReportTrackingService', () => {
  it('returns the reports of one reporter', async () => {
    const repository = fakeRepository();
    vi.mocked(repository.findByReporter).mockResolvedValue([storedReport()]);

    const result = await new HazardReportTrackingService(
      repository,
    ).listByReporter('citizen-001');

    expect(repository.findByReporter).toHaveBeenCalledWith('citizen-001');
    expect(result).toHaveLength(1);
  });

  it('returns an empty list when the reporter has sent nothing', async () => {
    const service = new HazardReportTrackingService(fakeRepository());
    expect(await service.listByReporter('nobody')).toEqual([]);
  });

  it('passes a storage error on to the caller', async () => {
    const repository = fakeRepository();
    vi.mocked(repository.findByReporter).mockRejectedValue(
      new Error('db down'),
    );
    await expect(
      new HazardReportTrackingService(repository).listByReporter('x'),
    ).rejects.toThrow('db down');
  });
});
