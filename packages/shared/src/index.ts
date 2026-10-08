// Shared DTO interfaces and enums used by both apps/api and apps/web.
// Types only, no runtime code — each use-case owner extends these as their module takes shape.

export type WarningSeverity = 'low' | 'moderate' | 'severe' | 'extreme';

export type HazardReportStatus =
  'pending_verification' | 'pending_synchronisation' | 'verified' | 'rejected';

export type ResourceStatus = 'available' | 'allocated' | 'depleted';

export type HazardType =
  'flood' | 'landslide' | 'road_blockage' | 'fire' | 'other';

export type ReporterRole =
  'citizen' | 'community_volunteer' | 'ground_level_officer';

export interface LocationDto {
  latitude: number;
  longitude: number;
}

export interface DistrictDto {
  id: string;
  name: string;
  province: string;
  /** Centre of the district. */
  latitude: number;
  longitude: number;
}

export interface WarningDto {
  id: string;
  district: DistrictDto['id'];
  severity: WarningSeverity;
}

/** A hazard report as the API returns it. Dates are ISO strings in JSON. */
export interface HazardReportDto {
  id: string;
  hazardType: HazardType;
  description: string;
  photoUrl?: string;
  placeName?: string;
  reporterName?: string;
  otherHazard?: string;
  location: LocationDto;
  district: DistrictDto['id'];
  capturedAt: string;
  submittedAt: string;
  status: HazardReportStatus;
  /** Ids of earlier reports that look like the same event. */
  possibleDuplicateOf: string[];
  reporterId: string;
  reporterRole: ReporterRole;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
}

/** Body of POST /hazard-reports and POST /hazard-reports/offline. */
export interface SubmitHazardReportRequest {
  hazardType: HazardType;
  description: string;
  photoUrl?: string;
  placeName?: string;
  reporterName?: string;
  otherHazard?: string;
  location: LocationDto;
  district: DistrictDto['id'];
  capturedAt: string;
  reporterId: string;
  reporterRole: ReporterRole;
}

export interface VerifyHazardReportRequest {
  operatorId: string;
}

export interface RejectHazardReportRequest extends VerifyHazardReportRequest {
  reason: string;
}

/** Answer of POST /hazard-reports/offline. */
export interface QueuedReportDto {
  status: HazardReportStatus;
  pendingCount: number;
}

/** Answer of POST /hazard-reports/sync. */
export interface SyncResultDto {
  synced: number;
  stillQueued: number;
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
