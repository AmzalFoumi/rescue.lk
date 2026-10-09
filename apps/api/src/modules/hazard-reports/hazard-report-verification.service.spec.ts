import { ConflictException, NotFoundException } from '@nestjs/common';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { HazardReportStatus } from './hazard-report-status.js';
import { HazardReportVerificationService } from './hazard-report-verification.service.js';
import {
  ID,
  MISSING_ID,
  fakeRepository,
  storedReport,
} from './hazard-report.test-data.js';
import type { HazardReportsRepository } from './hazard-reports.repository.interface.js';

describe('HazardReportVerificationService', () => {
  let service: HazardReportVerificationService;
  let repository: HazardReportsRepository;

  beforeEach(() => {
    repository = fakeRepository();
    service = new HazardReportVerificationService(repository);
  });

  describe('listPending and getById', () => {
    it('lists reports waiting for verification', async () => {
      vi.mocked(repository.findByStatus).mockResolvedValue([storedReport()]);

      const result = await service.listPending();

      expect(repository.findByStatus).toHaveBeenCalledWith(
        HazardReportStatus.PendingVerification,
      );
      expect(result).toHaveLength(1);
    });

    it('returns a report by id', async () => {
      expect((await service.getById(ID)).id).toBe(ID);
    });

    it('throws NotFound for an unknown id', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);
      await expect(service.getById(MISSING_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFound for a malformed id without asking the database', async () => {
      await expect(service.getById('abc')).rejects.toThrow(NotFoundException);
      expect(repository.findById).not.toHaveBeenCalled();
    });
  });

  describe('verify', () => {
    it('sets Verified and records the operator and time', async () => {
      await service.verify(ID, 'operator-001');

      expect(repository.updateStatus).toHaveBeenCalledWith(
        ID,
        expect.objectContaining({
          status: HazardReportStatus.Verified,
          verifiedBy: 'operator-001',
          verifiedAt: expect.any(Date),
        }),
      );
    });

    it('throws Conflict when the report is already verified', async () => {
      vi.mocked(repository.findById).mockResolvedValue(
        storedReport({ status: HazardReportStatus.Verified }),
      );
      await expect(service.verify(ID, 'operator-001')).rejects.toThrow(
        ConflictException,
      );
      expect(repository.updateStatus).not.toHaveBeenCalled();
    });

    it('throws NotFound for an unknown id', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);
      await expect(service.verify(MISSING_ID, 'operator-001')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFound when the report disappears before the update', async () => {
      vi.mocked(repository.updateStatus).mockResolvedValue(null);
      await expect(service.verify(ID, 'operator-001')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('reject', () => {
    it('sets Rejected and records the reason', async () => {
      await service.reject(ID, 'operator-001', 'Photo does not match');

      expect(repository.updateStatus).toHaveBeenCalledWith(
        ID,
        expect.objectContaining({
          status: HazardReportStatus.Rejected,
          rejectionReason: 'Photo does not match',
        }),
      );
    });

    it('throws Conflict when the report was already rejected', async () => {
      vi.mocked(repository.findById).mockResolvedValue(
        storedReport({ status: HazardReportStatus.Rejected }),
      );
      await expect(service.reject(ID, 'operator-001', 'again')).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
