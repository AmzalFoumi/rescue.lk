// Shared DTO interfaces and enums used by both apps/api and apps/web.
// Types only, no runtime code — each use-case owner extends these as their module takes shape.

export type WarningSeverity = 'low' | 'moderate' | 'severe' | 'extreme';

export type HazardReportStatus =
  'pending_verification' | 'pending_synchronisation' | 'verified' | 'rejected';

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

// ---------------------------------------------------------------------------
// UC3 Coordinate Emergency Response & Resources
// ---------------------------------------------------------------------------

/** Who owns a rescue team, a shelter or relief supplies. */
export type OrganisationKind =
  'government' | 'armed_forces' | 'ngo' | 'private_donor';

export type TeamStatus =
  'available' | 'dispatched' | 'returning' | 'unavailable';

export type ShelterStatus = 'available' | 'nearly_full' | 'full';

export type ReliefItem = 'food' | 'water' | 'medicine' | 'other';

/** The owning organisation, as it is shown beside every resource it owns. */
export interface OwnerDto {
  organisationId: string;
  name: string;
  kind: OrganisationKind;
}

/** The report a dispatched team is working on. */
export interface ActiveDispatchDto {
  reportId: string;
  dispatchedBy: string;
  dispatchedAt: string;
}

export interface RescueTeamDto {
  id: string;
  name: string;
  owner: OwnerDto;
  status: TeamStatus;
  district: DistrictDto['id'];
  location: LocationDto;
  activeDispatch?: ActiveDispatchDto;
}

/** Answer of GET /response/teams (Check Resource Availability). */
export interface TeamAvailabilityDto {
  teams: RescueTeamDto[];
  /** Zero means no team is available, so no dispatch can be made. */
  availableCount: number;
}

/** A verified hazard report that needs a response. */
export interface ResponseTargetDto {
  id: string;
  hazardType: HazardType;
  description: string;
  placeName?: string;
  district: DistrictDto['id'];
  location: LocationDto;
  capturedAt: string;
  dispatchedTeams: number;
  needsResponse: boolean;
}

export interface DispatchDto {
  id: string;
  reportId: string;
  teamId: string;
  teamName: string;
  owner: OwnerDto;
  district: DistrictDto['id'];
  dispatchedBy: string;
  dispatchedAt: string;
}

/** Answer of POST /response/dispatches. */
export interface DispatchConfirmationDto {
  dispatch: DispatchDto;
  team: RescueTeamDto;
}

/** Body of POST /response/dispatches. */
export interface DispatchRescueTeamRequest {
  reportId: string;
  teamId: string;
  officerId: string;
}

export interface UpdateTeamStatusRequest {
  status: TeamStatus;
}

export interface ShelterDto {
  id: string;
  name: string;
  owner: OwnerDto;
  district: DistrictDto['id'];
  capacity: number;
  currentOccupancy: number;
  status: ShelterStatus;
  placesAvailable: number;
}

/** Body of PATCH /response/shelters/:id/occupancy. A negative number is people leaving. */
export interface UpdateOccupancyRequest {
  people: number;
}

export interface ReliefDistributionDto {
  id: string;
  item: ReliefItem;
  quantity: number;
  district: DistrictDto['id'];
  owner: OwnerDto;
  distributedAt: string;
}

/** Body of POST /response/relief. */
export interface LogReliefDistributionRequest {
  item: ReliefItem;
  quantity: number;
  district: DistrictDto['id'];
  owner: OwnerDto;
}
