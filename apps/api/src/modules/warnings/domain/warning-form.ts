import type {
  AlertChannelType,
  WarningHazardType,
  WarningSeverity,
} from '@rescue-lk/shared';

// WarningForm is the warning content an officer edits, already normalised (text
// trimmed, optional fields defaulted) by warnings.mapper.
// Parameter Object: services and the validator pass the whole form as one value.
// Drafts may leave instructions and channels empty. SRP: WarningValidator, not this
// type, decides what each mode (DRAFT or PUBLISH) requires.
export interface WarningForm {
  sourceReportId: string;
  hazard: WarningHazardType;
  otherHazard: string;
  severity: WarningSeverity;
  areaIds: string[];
  message: string;
  instructions: string;
  channels: AlertChannelType[];
}

// An update keeps the original source report, so it cannot be changed.
export type WarningContent = Omit<WarningForm, 'sourceReportId'>;
