import type {
  DispatchConfirmationDto,
  DispatchDto,
  DispatchRescueTeamRequest,
  LogReliefDistributionRequest,
  ReliefDistributionDto,
  RescueTeamDto,
  ResponseTargetDto,
  ShelterDto,
  TeamAvailabilityDto,
  TeamStatus,
  UpdateOccupancyRequest,
  UpdateTeamStatusRequest,
} from '@rescue-lk/shared';
import { request } from '@/lib/api';

/** Everything the UC3 screens ask of the API. Screens depend on this, not on fetch. */
export interface ResponseApi {
  /** Step 2: verified hazard reports that need a response. */
  listReports(): Promise<ResponseTargetDto[]>;
  /** Step 5, Check Resource Availability: teams from every organisation. */
  listTeams(filter?: {
    district?: string;
    status?: TeamStatus;
  }): Promise<TeamAvailabilityDto>;
  /** Steps 6 to 8: dispatch a team to a report. */
  dispatch(
    reportId: string,
    teamId: string,
    officerId: string,
  ): Promise<DispatchConfirmationDto>;
  listDispatchesForReport(reportId: string): Promise<DispatchDto[]>;
  changeTeamStatus(id: string, status: TeamStatus): Promise<RescueTeamDto>;
  listShelters(district?: string): Promise<ShelterDto[]>;
  /** A negative number of people is an evacuee leaving. */
  changeOccupancy(id: string, people: number): Promise<ShelterDto>;
  listRelief(district?: string): Promise<ReliefDistributionDto[]>;
  logRelief(
    handout: LogReliefDistributionRequest,
  ): Promise<ReliefDistributionDto>;
}

/** Sends one request. The real one is `request` from lib/api; tests pass a fake. */
export type Requester = <T>(path: string, init?: RequestInit) => Promise<T>;

const BASE = '/response';

function post(body: unknown): RequestInit {
  return { method: 'POST', body: JSON.stringify(body) };
}

function patch(body: unknown): RequestInit {
  return { method: 'PATCH', body: JSON.stringify(body) };
}

/** Adds the query string only for the filters that are set. */
function withQuery(path: string, filter: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filter)) {
    if (value) query.set(key, value);
  }
  const text = query.toString();
  return text ? `${path}?${text}` : path;
}

export function createResponseApi(send: Requester = request): ResponseApi {
  return {
    listReports: () => send<ResponseTargetDto[]>(`${BASE}/reports`),

    listTeams: (filter = {}) =>
      send<TeamAvailabilityDto>(withQuery(`${BASE}/teams`, filter)),

    dispatch: (reportId, teamId, officerId) =>
      send<DispatchConfirmationDto>(
        `${BASE}/dispatches`,
        post({
          reportId,
          teamId,
          officerId,
        } satisfies DispatchRescueTeamRequest),
      ),

    listDispatchesForReport: (reportId) =>
      send<DispatchDto[]>(
        `${BASE}/dispatches/report/${encodeURIComponent(reportId)}`,
      ),

    changeTeamStatus: (id, status) =>
      send<RescueTeamDto>(
        `${BASE}/teams/${encodeURIComponent(id)}/status`,
        patch({ status } satisfies UpdateTeamStatusRequest),
      ),

    listShelters: (district) =>
      send<ShelterDto[]>(withQuery(`${BASE}/shelters`, { district })),

    changeOccupancy: (id, people) =>
      send<ShelterDto>(
        `${BASE}/shelters/${encodeURIComponent(id)}/occupancy`,
        patch({ people } satisfies UpdateOccupancyRequest),
      ),

    listRelief: (district) =>
      send<ReliefDistributionDto[]>(withQuery(`${BASE}/relief`, { district })),

    logRelief: (handout) =>
      send<ReliefDistributionDto>(`${BASE}/relief`, post(handout)),
  };
}
