import { ConflictException, NotFoundException } from '@nestjs/common';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { HazardReportsService } from './hazard-reports.service.js';
import { HazardReportStatus } from './hazard-report-status.js';
import { HazardType, ReporterRole } from './hazard-type.js';
import { InMemoryOfflineReportQueue } from './offline-report-queue.js';
import type { HazardReportsRepository } from './hazard-reports.repository.interface.js';
import type { SubmitHazardReportDto } from './dto/submit-hazard-report.dto.js';
import type { HazardReportDocument } from './schemas/hazard-report.schema.js';

const dto: SubmitHazardReportDto = {
  hazardType: HazardType.Flood,
  description: 'Water is rising',
  latitude: 6.9271,
  longitude: 79.8612,
  district: '65f1a2b3c4d5e6f7a8b9c0d1',
  capturedAt: '2026-10-08T10:00:00Z',
  reporterId: 'citizen-001',
  reporterRole: ReporterRole.Citizen,
};

// Builds a fake stored report. Only the fields the service reads are filled in.
const stored = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 'r1',
    hazardType: HazardType.Flood,
    latitude: 6.9271,
    longitude: 79.8612,
    capturedAt: new Date('2026-10-08T08:00:00Z'),
    status: HazardReportStatus.PendingVerification,
    ...overrides,
  }) as unknown as HazardReportDocument;

describe('HazardReportsService', () => {
  let service: HazardReportsService;
  let repository: HazardReportsRepository;
  let queue: InMemoryOfflineReportQueue;

  beforeEach(() => {
    repository = {
      create: vi.fn(
        async (report) =>
          ({ id: 'new', ...report }) as unknown as HazardReportDocument,
      ),
      findById: vi.fn().mockResolvedValue(stored()),
      findByStatus: vi.fn().mockResolvedValue([]),
      findByTypeBetween: vi.fn().mockResolvedValue([]),
      updateStatus: vi.fn(async (_id, change) => stored({ ...change })),
    };
    queue = new InMemoryOfflineReportQueue();
    service = new HazardReportsService(repository, queue);
  });

  it('reports health', () => {
    expect(service.health()).toEqual({
      status: 'ok',
      module: 'hazard-reports',
    });
  });

  describe('submit', () => {
    it('stores the report as Pending Verification with no duplicates', async () => {
      const result = await service.submit(dto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: HazardReportStatus.PendingVerification,
          possibleDuplicateOf: [],
          capturedAt: new Date(dto.capturedAt),
        }),
      );
      expect(result.status).toBe(HazardReportStatus.PendingVerification);
    });

    it('flags a nearby recent report as a possible duplicate but still stores it', async () => {
      vi.mocked(repository.findByTypeBetween).mockResolvedValue([
        stored({ id: 'old' }),
      ]);

      await service.submit(dto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ possibleDuplicateOf: ['old'] }),
      );
    });

    it('does not flag a report that is far away', async () => {
      vi.mocked(repository.findByTypeBetween).mockResolvedValue([
        stored({ latitude: 7.5 }),
      ]);

      await service.submit(dto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ possibleDuplicateOf: [] }),
      );
    });

    it('passes the storage error on to the caller', async () => {
      vi.mocked(repository.create).mockRejectedValue(new Error('db down'));
      await expect(service.submit(dto)).rejects.toThrow('db down');
    });
  });

  describe('offline queue', () => {
    it('queues a report as Pending Synchronisation without storing it', () => {
      const result = service.queueOffline(dto);

      expect(result).toEqual({
        status: HazardReportStatus.PendingSynchronisation,
        pendingCount: 1,
      });
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('stores queued reports when syncing and empties the queue', async () => {
      service.queueOffline(dto);
      service.queueOffline(dto);

      const result = await service.syncQueued();

      expect(result).toEqual({ synced: 2, stillQueued: 0 });
      expect(repository.create).toHaveBeenCalledTimes(2);
    });

    it('keeps a report queued when storing it fails', async () => {
      service.queueOffline(dto);
      vi.mocked(repository.create).mockRejectedValue(new Error('db down'));

      const result = await service.syncQueued();

      expect(result).toEqual({ synced: 0, stillQueued: 1 });
      expect(queue.pendingCount()).toBe(1);
    });
  });

  describe('listPending and getById', () => {
    it('lists reports waiting for verification', async () => {
      vi.mocked(repository.findByStatus).mockResolvedValue([stored()]);

      const result = await service.listPending();

      expect(repository.findByStatus).toHaveBeenCalledWith(
        HazardReportStatus.PendingVerification,
      );
      expect(result).toHaveLength(1);
    });

    it('returns a report by id', async () => {
      expect((await service.getById('r1')).id).toBe('r1');
    });

    it('throws NotFound for an unknown id', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);
      await expect(service.getById('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('verify', () => {
    it('sets Verified and records the operator and time', async () => {
      await service.verify('r1', 'operator-001');

      expect(repository.updateStatus).toHaveBeenCalledWith(
        'r1',
        expect.objectContaining({
          status: HazardReportStatus.Verified,
          verifiedBy: 'operator-001',
          verifiedAt: expect.any(Date),
        }),
      );
    });

    it('throws Conflict when the report is already verified', async () => {
      vi.mocked(repository.findById).mockResolvedValue(
        stored({ status: HazardReportStatus.Verified }),
      );
      await expect(service.verify('r1', 'operator-001')).rejects.toThrow(
        ConflictException,
      );
      expect(repository.updateStatus).not.toHaveBeenCalled();
    });

    it('throws NotFound for an unknown id', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);
      await expect(service.verify('missing', 'operator-001')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFound when the report disappears before the update', async () => {
      vi.mocked(repository.updateStatus).mockResolvedValue(null);
      await expect(service.verify('r1', 'operator-001')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('reject', () => {
    it('sets Rejected and records the reason', async () => {
      await service.reject('r1', 'operator-001', 'Photo does not match');

      expect(repository.updateStatus).toHaveBeenCalledWith(
        'r1',
        expect.objectContaining({
          status: HazardReportStatus.Rejected,
          rejectionReason: 'Photo does not match',
        }),
      );
    });

    it('throws Conflict when the report was already rejected', async () => {
      vi.mocked(repository.findById).mockResolvedValue(
        stored({ status: HazardReportStatus.Rejected }),
      );
      await expect(
        service.reject('r1', 'operator-001', 'again'),
      ).rejects.toThrow(ConflictException);
    });
  });
});
