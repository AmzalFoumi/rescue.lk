import type {
  HazardReportDto,
  QueuedReportDto,
  RejectHazardReportRequest,
  SubmitHazardReportRequest,
  SyncResultDto,
  VerifyHazardReportRequest,
} from '@rescue-lk/shared';
import { request } from '@/lib/api';

/** Everything the UC2 screens ask of the API. Screens depend on this, not on fetch. */
export interface HazardReportsApi {
  submit(report: SubmitHazardReportRequest): Promise<HazardReportDto>;
  queueOffline(report: SubmitHazardReportRequest): Promise<QueuedReportDto>;
  sync(): Promise<SyncResultDto>;
  listPending(): Promise<HazardReportDto[]>;
  listByReporter(reporterId: string): Promise<HazardReportDto[]>;
  getById(id: string): Promise<HazardReportDto>;
  verify(id: string, operatorId: string): Promise<HazardReportDto>;
  reject(
    id: string,
    operatorId: string,
    reason: string,
  ): Promise<HazardReportDto>;
}

/** Sends one request. The real one is `request` from lib/api; tests pass a fake. */
export type Requester = <T>(path: string, init?: RequestInit) => Promise<T>;

const BASE = '/hazard-reports';

function post(body?: unknown): RequestInit {
  return {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  };
}

function patch(body: unknown): RequestInit {
  return { method: 'PATCH', body: JSON.stringify(body) };
}

export function createHazardReportsApi(
  send: Requester = request,
): HazardReportsApi {
  return {
    submit: (report) => send<HazardReportDto>(BASE, post(report)),
    queueOffline: (report) =>
      send<QueuedReportDto>(`${BASE}/offline`, post(report)),
    sync: () => send<SyncResultDto>(`${BASE}/sync`, post()),
    listPending: () => send<HazardReportDto[]>(BASE),
    listByReporter: (reporterId) =>
      send<HazardReportDto[]>(
        `${BASE}?reporterId=${encodeURIComponent(reporterId)}`,
      ),
    getById: (id) => send<HazardReportDto>(`${BASE}/${encodeURIComponent(id)}`),
    verify: (id, operatorId) =>
      send<HazardReportDto>(
        `${BASE}/${encodeURIComponent(id)}/verify`,
        patch({ operatorId } satisfies VerifyHazardReportRequest),
      ),
    reject: (id, operatorId, reason) =>
      send<HazardReportDto>(
        `${BASE}/${encodeURIComponent(id)}/reject`,
        patch({ operatorId, reason } satisfies RejectHazardReportRequest),
      ),
  };
}
