import type {
  AlertChannelType,
  HazardType,
  WarningSeverity,
} from '@rescue-lk/shared';

// Parameter object: the warning content an officer edits, already normalised
// (trimmed, optional fields defaulted). Drafts may leave instructions and
// channels empty; WarningValidator decides what each mode requires.
export interface WarningForm {
  sourceReportId: string;
  hazard: HazardType;
  otherHazard: string;
  severity: WarningSeverity;
  areaIds: string[];
  message: string;
  instructions: string;
  channels: AlertChannelType[];
}

// An update keeps the original source report, so it cannot be changed.
export type WarningContent = Omit<WarningForm, 'sourceReportId'>;
