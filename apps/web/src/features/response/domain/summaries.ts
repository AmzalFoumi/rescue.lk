import type {
  DistrictDto,
  ReliefDistributionDto,
  RescueTeamDto,
  ResponseTargetDto,
  ShelterDto,
  TeamStatus,
} from '@rescue-lk/shared';
import { districtName, formatNumber, percentage } from './format';
import {
  TEAM_STATUS_PRESENTATION,
  type IconName,
  type Tone,
} from './presentation';

/**
 * The numbers on the Response Operations screen. Every one is worked out from
 * the rows below it, so a total can never disagree with its own table.
 */

export interface Kpi {
  key: string;
  label: string;
  value: string;
  sub: string;
  tone: Tone;
  icon: IconName;
}

export interface TeamStatusCount {
  status: TeamStatus;
  label: string;
  count: number;
  icon: IconName;
}

export interface ShelterTotals {
  shelters: number;
  capacity: number;
  occupancy: number;
  placesAvailable: number;
  percentage: string;
  full: number;
  nearlyFull: number;
}

export interface DistrictTotal {
  district: string;
  name: string;
  quantity: number;
  /** Share of the largest district total, 0 to 1, for the bar width. */
  share: number;
}

export function shelterTotals(shelters: ShelterDto[]): ShelterTotals {
  const capacity = shelters.reduce((sum, s) => sum + s.capacity, 0);
  const occupancy = shelters.reduce((sum, s) => sum + s.currentOccupancy, 0);
  return {
    shelters: shelters.length,
    capacity,
    occupancy,
    placesAvailable: shelters.reduce((sum, s) => sum + s.placesAvailable, 0),
    percentage: percentage(occupancy, capacity),
    full: shelters.filter((s) => s.status === 'full').length,
    nearlyFull: shelters.filter((s) => s.status === 'nearly_full').length,
  };
}

export function teamStatusCounts(teams: RescueTeamDto[]): TeamStatusCount[] {
  return (Object.keys(TEAM_STATUS_PRESENTATION) as TeamStatus[]).map(
    (status) => ({
      status,
      label: TEAM_STATUS_PRESENTATION[status].label,
      icon: TEAM_STATUS_PRESENTATION[status].icon,
      count: teams.filter((team) => team.status === status).length,
    }),
  );
}

/** How many different organisations own at least one team. */
export function organisationCount(teams: RescueTeamDto[]): number {
  return new Set(teams.map((team) => team.owner.organisationId)).size;
}

/** Relief quantity per district, largest first, with a share for the bars. */
export function reliefByDistrict(
  distributions: ReliefDistributionDto[],
  districts: DistrictDto[],
): DistrictTotal[] {
  const totals = new Map<string, number>();
  for (const record of distributions) {
    totals.set(
      record.district,
      (totals.get(record.district) ?? 0) + record.quantity,
    );
  }
  const rows = [...totals.entries()].sort(([, a], [, b]) => b - a);
  const largest = rows[0]?.[1] ?? 0;
  return rows.map(([district, quantity]) => ({
    district,
    name: districtName(district, districts),
    quantity,
    share: largest > 0 ? quantity / largest : 0,
  }));
}

export function responseKpis(
  reports: ResponseTargetDto[],
  teams: RescueTeamDto[],
  shelters: ShelterDto[],
): Kpi[] {
  const awaiting = reports.filter((report) => report.needsResponse).length;
  const dispatched = teams.filter((team) => team.status === 'dispatched');
  const available = teams.filter((team) => team.status === 'available');
  const totals = shelterTotals(shelters);
  return [
    {
      key: 'incidents',
      label: 'Active incidents',
      value: String(reports.length),
      sub: 'Verified reports open for response',
      tone: 'info',
      icon: 'triangle-alert',
    },
    {
      key: 'awaiting',
      label: 'Awaiting a team',
      value: String(awaiting),
      sub: awaiting > 0 ? 'Need dispatch' : 'All incidents covered',
      tone: awaiting > 0 ? 'caution' : 'success',
      icon: 'circle-help',
    },
    {
      key: 'teams',
      label: 'Teams dispatched',
      value: `${dispatched.length} of ${teams.length}`,
      sub: `${available.length} available · ${organisationCount(teams)} organisations`,
      tone: 'success',
      icon: 'truck',
    },
    {
      key: 'shelters',
      label: 'Shelter occupancy',
      value: `${formatNumber(totals.occupancy)} / ${formatNumber(totals.capacity)}`,
      sub: `${totals.percentage} full · ${totals.full} full, ${totals.nearlyFull} nearly full`,
      tone: totals.full > 0 ? 'danger' : 'neutral',
      icon: 'house',
    },
  ];
}
