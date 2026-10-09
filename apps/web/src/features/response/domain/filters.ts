import type {
  DistrictDto,
  HazardType,
  OrganisationKind,
  RescueTeamDto,
  ResponseTargetDto,
  ShelterDto,
  ShelterStatus,
  TeamStatus,
} from '@rescue-lk/shared';
import { districtName } from './format';

/** The filters above each table. "all" means the filter is off. */

export const ALL = 'all';

export interface IncidentFilters {
  search: string;
  hazardType: HazardType | typeof ALL;
  district: string;
  responseStatus: 'needs_response' | 'has_team' | typeof ALL;
}

export interface TeamFilters {
  search: string;
  owner: OrganisationKind | typeof ALL;
  status: TeamStatus | typeof ALL;
  /** Only teams in the chosen report's district. */
  nearbyOnly: boolean;
}

export interface ShelterFilters {
  search: string;
  status: ShelterStatus | typeof ALL;
  district: string;
}

export const EMPTY_INCIDENT_FILTERS: IncidentFilters = {
  search: '',
  hazardType: ALL,
  district: ALL,
  responseStatus: ALL,
};

export const EMPTY_TEAM_FILTERS: TeamFilters = {
  search: '',
  owner: ALL,
  status: ALL,
  nearbyOnly: true,
};

export const EMPTY_SHELTER_FILTERS: ShelterFilters = {
  search: '',
  status: ALL,
  district: ALL,
};

function matches(text: string, search: string): boolean {
  return text.toLowerCase().includes(search.trim().toLowerCase());
}

export function filterIncidents(
  reports: ResponseTargetDto[],
  filters: IncidentFilters,
  districts: DistrictDto[],
): ResponseTargetDto[] {
  return reports.filter((report) => {
    const haystack = [
      report.id,
      report.placeName ?? '',
      report.description,
      districtName(report.district, districts),
    ].join(' ');
    if (filters.search && !matches(haystack, filters.search)) return false;
    if (filters.hazardType !== ALL && report.hazardType !== filters.hazardType)
      return false;
    if (filters.district !== ALL && report.district !== filters.district)
      return false;
    if (filters.responseStatus === 'needs_response' && !report.needsResponse)
      return false;
    if (filters.responseStatus === 'has_team' && report.needsResponse)
      return false;
    return true;
  });
}

export function filterTeams(
  teams: RescueTeamDto[],
  filters: TeamFilters,
  nearbyDistrict?: string,
): RescueTeamDto[] {
  return teams.filter((team) => {
    const haystack = `${team.name} ${team.owner.name}`;
    if (filters.search && !matches(haystack, filters.search)) return false;
    if (filters.owner !== ALL && team.owner.kind !== filters.owner)
      return false;
    if (filters.status !== ALL && team.status !== filters.status) return false;
    // Without a chosen report there is no district to be near, so the box does nothing.
    if (
      filters.nearbyOnly &&
      nearbyDistrict &&
      team.district !== nearbyDistrict
    )
      return false;
    return true;
  });
}

export function filterShelters(
  shelters: ShelterDto[],
  filters: ShelterFilters,
  districts: DistrictDto[],
): ShelterDto[] {
  return shelters.filter((shelter) => {
    const haystack = `${shelter.name} ${districtName(shelter.district, districts)}`;
    if (filters.search && !matches(haystack, filters.search)) return false;
    if (filters.status !== ALL && shelter.status !== filters.status)
      return false;
    if (filters.district !== ALL && shelter.district !== filters.district)
      return false;
    return true;
  });
}
