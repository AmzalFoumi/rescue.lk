import type { SubmitHazardReportRequest } from '@rescue-lk/shared';

/** A report saved while the network was off. It waits to be sent. */
export interface QueuedReport {
  /** An id made on this device. The server gives the report a real id when it is sent. */
  localId: string;
  request: SubmitHazardReportRequest;
  savedAt: string;
}
