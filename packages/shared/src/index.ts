// Shared DTO interfaces and enums used by both apps/api and apps/web.
// Types only, no runtime code — each use-case owner extends these as their module takes shape.

// UC1 vocabulary (matches the UC1 warning management design).
export type WarningSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type AlertChannelType = 'SMS' | 'PUSH' | 'SIREN';

export type WarningStatus = 'DRAFT' | 'ACTIVE' | 'CANCELLED';

export type DeliveryStatus = 'QUEUED' | 'SENT' | 'RETRYING' | 'FAILED';

export type HazardReportStatus =
  'pending_verification' | 'pending_synchronisation' | 'verified' | 'rejected';

// One hazard type for every use case (warnings, hazard reports, response).
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
