import type { AlertChannelType, WarningSeverity } from '@rescue-lk/shared';

// Parameter object for issuing a warning (avoids a long parameter list).
// Unlike the request DTO, expiresAt is already a Date.
export interface IssueWarningCommand {
  hazardReportId: string;
  title: string;
  message: string;
  severity: WarningSeverity;
  districts: string[];
  channels: AlertChannelType[];
  expiresAt: Date;
}
