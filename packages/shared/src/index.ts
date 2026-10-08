// Shared DTO interfaces and enums used by both apps/api and apps/web.
// Types only, no runtime code — each use-case owner extends these as their module takes shape.

export type WarningSeverity = 'low' | 'moderate' | 'severe' | 'extreme';

export type AlertChannelType = 'push' | 'sms' | 'audible';

export type WarningStatus = 'active' | 'cancelled' | 'expired';

export type DeliveryStatus = 'pending' | 'sent' | 'failed';

export type HazardReportStatus = 'pending' | 'verified' | 'rejected';

export type ResourceStatus = 'available' | 'allocated' | 'depleted';

export interface DistrictDto {
  id: string;
  name: string;
  province: string;
}

// Dates are ISO 8601 strings, as they travel over JSON.
export interface WarningDto {
  id: string;
  hazardReportId: HazardReportDto['id'];
  title: string;
  message: string;
  severity: WarningSeverity;
  districts: DistrictDto['id'][];
  channels: AlertChannelType[];
  status: WarningStatus;
  issuedAt: string;
  expiresAt: string;
}

export interface IssueWarningRequestDto {
  hazardReportId: HazardReportDto['id'];
  title: string;
  message: string;
  severity: WarningSeverity;
  districts: DistrictDto['id'][];
  channels: AlertChannelType[];
  expiresAt: string;
}

export interface DeliveryRecordDto {
  id: string;
  warningId: WarningDto['id'];
  channel: AlertChannelType;
  status: DeliveryStatus;
  attempts: number;
  failureReason?: string;
  lastAttemptAt?: string;
}

export interface WarningDeliveryResultDto {
  warning: WarningDto;
  deliveries: DeliveryRecordDto[];
}

// UC1's read view of a UC2 hazard report that has passed verification.
export interface VerifiedHazardReportDto {
  id: HazardReportDto['id'];
  hazardType: string;
  district: DistrictDto['id'];
  status: Extract<HazardReportStatus, 'verified'>;
  description: string;
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
