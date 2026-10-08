// Shared DTO interfaces and enums used by both apps/api and apps/web.
// Types only, no runtime code — each use-case owner extends these as their module takes shape.

// UC1 vocabulary (matches the UC1 warning management design).
export type WarningSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type AlertChannelType = 'SMS' | 'PUSH' | 'SIREN';

export type WarningStatus = 'DRAFT' | 'ACTIVE' | 'CANCELLED';

export type DeliveryStatus = 'QUEUED' | 'SENT' | 'RETRYING' | 'FAILED';

export type HazardType =
  'FLOOD' | 'LANDSLIDE' | 'ROAD_BLOCKAGE' | 'FIRE' | 'OTHER';

export type HazardReportStatus = 'pending' | 'verified' | 'rejected';

export type ResourceStatus = 'available' | 'allocated' | 'depleted';

export interface DistrictDto {
  id: string;
  name: string;
  province: string;
}

// A district or a river basin a warning can target (ids such as 'D-COLOMBO', 'B-KELANI').
export type TargetAreaKind = 'DISTRICT' | 'RIVER_BASIN';

export interface TargetAreaDto {
  id: string;
  kind: TargetAreaKind;
  name: string;
  districts: string[];
}

// Dates are ISO 8601 strings, as they travel over JSON.
export interface WarningDto {
  id: string;
  sourceReportId: HazardReportDto['id'];
  hazard: HazardType;
  otherHazard: string;
  severity: WarningSeverity;
  areaIds: TargetAreaDto['id'][];
  message: string;
  instructions: string;
  channels: AlertChannelType[];
  status: WarningStatus;
  version: number;
  createdBy: string;
  createdAt: string;
  publishedAt: string | null;
  updatedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string;
}

// The warning form as the officer fills it in; drafts may leave some fields empty.
export interface WarningFormRequestDto {
  sourceReportId: HazardReportDto['id'];
  hazard: HazardType;
  otherHazard?: string;
  severity: WarningSeverity;
  areaIds: TargetAreaDto['id'][];
  message: string;
  instructions?: string;
  channels?: AlertChannelType[];
}

// Saving a draft or publishing also records who did it (no login yet).
// draftId edits or publishes an existing draft instead of creating a new warning.
export interface SubmitWarningRequestDto extends WarningFormRequestDto {
  createdBy: string;
  draftId?: string;
}

// Updating an ACTIVE warning cannot change its source report.
export type UpdateWarningRequestDto = Omit<
  WarningFormRequestDto,
  'sourceReportId'
>;

export interface CancelWarningRequestDto {
  reason: string;
}

export type WarningFormField =
  | 'sourceReportId'
  | 'hazard'
  | 'otherHazard'
  | 'severity'
  | 'areaIds'
  | 'message'
  | 'instructions'
  | 'channels'
  | 'cancelReason';

// One message per invalid field, so the UI can show each next to its input.
export type WarningFormErrors = Partial<Record<WarningFormField, string>>;

export interface DeliveryRecordDto {
  id: string;
  warningId: WarningDto['id'];
  warningVersion: WarningDto['version'];
  channel: AlertChannelType;
  status: DeliveryStatus;
  attempts: number;
  recipients: number;
  lastAttemptAt: string | null;
  error: string;
}

export interface WarningDeliveryResultDto {
  warning: WarningDto;
  deliveries: DeliveryRecordDto[];
}

// UC1's read view of a UC2 hazard report that has passed verification.
// Dates are ISO 8601 strings.
export interface VerifiedHazardReportDto {
  id: HazardReportDto['id'];
  hazardType: HazardType;
  district: DistrictDto['id'];
  districtName: string;
  place: string;
  reporter: string;
  status: Extract<HazardReportStatus, 'verified'>;
  description: string;
  submittedAt: string;
  verifiedAt: string;
  verifiedBy: string;
}

// Expected reach of a warning on each channel before it is sent
// (people for SMS and push, siren towers for SIREN).
export interface ChannelReachDto {
  channel: AlertChannelType;
  recipients: number;
}

export interface ReachEstimateDto {
  // District names the selected areas cover.
  districts: string[];
  channels: ChannelReachDto[];
}

export interface HazardReportDto {
  id: string;
  district: DistrictDto['id'];
  status: HazardReportStatus;
}

export interface IncidentDto {
  id: string;
  district: DistrictDto['id'];
}

export interface ShelterDto {
  id: string;
  district: DistrictDto['id'];
}

export interface ResourceDto {
  id: string;
  district: DistrictDto['id'];
  status: ResourceStatus;
}
