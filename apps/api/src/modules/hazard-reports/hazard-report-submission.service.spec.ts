import { describe, beforeEach, it, expect, vi } from 'vitest';
import { DuplicateChecker } from './duplicate-checker.js';
import { HazardReportStatus } from './hazard-report-status.js';
import { HazardReportSubmissionService } from './hazard-report-submission.service.js';
import {
  fakeRepository,
  storedReport,
  submission,
} from './hazard-report.test-data.js';
import type { HazardReportsRepository } from './hazard-reports.repository.interface.js';
import { InMemoryOfflineReportQueue } from './offline-report-queue.js';

describe('HazardReportSubmissionService', () => {
  let service: HazardReportSubmissionService;
  let repository: HazardReportsRepository;
  let queue: InMemoryOfflineReportQueue;

  beforeEach(() => {
    repository = fakeRepository();
    queue = new InMemoryOfflineReportQueue();
    service = new HazardReportSubmissionService(
      repository,
      queue,
      new DuplicateChecker(),
    );
  });

  describe('submit', () => {
    it('stores the report as Pending Verification with no duplicates', async () => {
      const result = await service.submit(submission);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: HazardReportStatus.PendingVerification,
          possibleDuplicateOf: [],
          capturedAt: new Date(submission.capturedAt),
        }),
      );
      expect(result.status).toBe(HazardReportStatus.PendingVerification);
    });

    it('looks for duplicates only inside the time window', async () => {
      await service.submit(submission);

      const [type, from, to] = vi.mocked(repository.findByTypeBetween).mock
        .calls[0];
      expect(type).toBe(submission.hazardType);
      expect(to.getTime() - from.getTime()).toBe(48 * 60 * 60 * 1000);
    });

    it('flags a nearby recent report as a possible duplicate but still stores it', async () => {
      vi.mocked(repository.findByTypeBetween).mockResolvedValue([
        storedReport({ id: 'old' }),
      ]);

      await service.submit(submission);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ possibleDuplicateOf: ['old'] }),
      );
    });

    it('does not flag a report that is far away', async () => {
      vi.mocked(repository.findByTypeBetween).mockResolvedValue([
        storedReport({ location: { latitude: 7.5, longitude: 79.8612 } }),
      ]);

      await service.submit(submission);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ possibleDuplicateOf: [] }),
      );
    });

    it('passes the storage error on to the caller', async () => {
      vi.mocked(repository.create).mockRejectedValue(new Error('db down'));
      await expect(service.submit(submission)).rejects.toThrow('db down');
    });
  });

  describe('offline queue', () => {
    it('queues a report as Pending Synchronisation without storing it', () => {
      const result = service.queueOffline(submission);

      expect(result).toEqual({
        status: HazardReportStatus.PendingSynchronisation,
        pendingCount: 1,
      });
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('stores queued reports when syncing and empties the queue', async () => {
      service.queueOffline(submission);
      service.queueOffline(submission);

      const result = await service.syncQueued();

      expect(result).toEqual({ synced: 2, stillQueued: 0 });
      expect(repository.create).toHaveBeenCalledTimes(2);
    });

    it('keeps a report queued when storing it fails', async () => {
      service.queueOffline(submission);
      vi.mocked(repository.create).mockRejectedValue(new Error('db down'));

      const result = await service.syncQueued();

      expect(result).toEqual({ synced: 0, stillQueued: 1 });
      expect(queue.pendingCount()).toBe(1);
    });
  });
});
