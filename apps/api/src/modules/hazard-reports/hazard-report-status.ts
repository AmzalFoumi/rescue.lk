export enum HazardReportStatus {
  PendingVerification = 'pending_verification',
  PendingSynchronisation = 'pending_synchronisation',
  Verified = 'verified',
  Rejected = 'rejected',
}

/**
 * A tiny state machine: a report may only leave "pending verification" once,
 * to either "verified" or "rejected". Everything else is final.
 */
const ALLOWED_CHANGES: Record<HazardReportStatus, HazardReportStatus[]> = {
  [HazardReportStatus.PendingVerification]: [
    HazardReportStatus.Verified,
    HazardReportStatus.Rejected,
  ],
  [HazardReportStatus.PendingSynchronisation]: [],
  [HazardReportStatus.Verified]: [],
  [HazardReportStatus.Rejected]: [],
};

/** True when a report may move from one status to the other. */
export function canChangeStatus(
  from: HazardReportStatus,
  to: HazardReportStatus,
): boolean {
  return ALLOWED_CHANGES[from].includes(to);
}
