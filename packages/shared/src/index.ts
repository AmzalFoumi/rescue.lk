// Shared DTO interfaces and enums used by both apps/api and apps/web.
// Types only, no runtime code — each use-case owner extends these as their module takes shape.

export type WarningSeverity = 'low' | 'moderate' | 'severe' | 'extreme';

export type HazardReportStatus = 'pending' | 'verified' | 'rejected';

export type ResourceStatus = 'available' | 'allocated' | 'depleted';

export interface DistrictDto {
  id: string;
  name: string;
  province: string;
}

export interface WarningDto {
  id: string;
  district: DistrictDto['id'];
  severity: WarningSeverity;
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
