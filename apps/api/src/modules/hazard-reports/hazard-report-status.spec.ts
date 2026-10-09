import { describe, it, expect } from 'vitest';
import { HazardReportStatus, canChangeStatus } from './hazard-report-status.js';

describe('canChangeStatus', () => {
  it('lets a pending report be verified', () => {
    expect(
      canChangeStatus(
        HazardReportStatus.PendingVerification,
        HazardReportStatus.Verified,
      ),
    ).toBe(true);
  });

  it('lets a pending report be rejected', () => {
    expect(
      canChangeStatus(
        HazardReportStatus.PendingVerification,
        HazardReportStatus.Rejected,
      ),
    ).toBe(true);
  });

  it('does not let a verified report change again', () => {
    expect(
      canChangeStatus(HazardReportStatus.Verified, HazardReportStatus.Rejected),
    ).toBe(false);
  });

  it('does not let a rejected report change again', () => {
    expect(
      canChangeStatus(HazardReportStatus.Rejected, HazardReportStatus.Verified),
    ).toBe(false);
  });

  it('does not let a report waiting to sync be verified', () => {
    expect(
      canChangeStatus(
        HazardReportStatus.PendingSynchronisation,
        HazardReportStatus.Verified,
      ),
    ).toBe(false);
  });
});
