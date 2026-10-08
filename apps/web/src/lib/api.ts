import type {
  CancelWarningRequestDto,
  DeliveryRecordDto,
  DistrictDto,
  HazardReportDto,
  IncidentDto,
  ReachEstimateDto,
  SubmitWarningRequestDto,
  TargetAreaDto,
  UpdateWarningRequestDto,
  VerifiedHazardReportDto,
  WarningDeliveryResultDto,
  WarningDto,
  WarningStatus,
} from '@rescue-lk/shared';
import { ApiError } from './api-error';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

// Parses a JSON body; keeps the raw text when the body is not JSON (e.g. a
// proxy error page) so it can still be shown, and null when there is no body.
async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

// Exception mapping in one place: a network failure or HTTP error always becomes an
// ApiError, so hooks never read status codes or parse error bodies themselves.
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch (error) {
    throw ApiError.from(error);
  }

  const body = await readBody(response);
  if (!response.ok) {
    throw ApiError.fromResponse(response.status, body);
  }
  return body as T;
}

const send = (method: 'POST' | 'PATCH', body?: unknown): RequestInit => ({
  method,
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

// Makes a value safe to place inside a URL path or query.
const encodePath = (value: string) => encodeURIComponent(value);

// api is the one typed client for every UC1 endpoint.
// DRY: hooks call api.warnings.* instead of writing fetch calls, so URLs, headers and
// error handling are written once.
// Requests and responses use the shared DTO types, so the web app and the API agree
// on every shape at compile time.
export const api = {
  districts: {
    list: () => request<DistrictDto[]>('/districts'),
  },
  warnings: {
    list: (status?: WarningStatus) =>
      request<WarningDto[]>(
        status ? `/warnings?status=${encodePath(status)}` : '/warnings',
      ),
    verifiedReports: () =>
      request<VerifiedHazardReportDto[]>('/warnings/verified-reports'),
    targetAreas: () => request<TargetAreaDto[]>('/warnings/target-areas'),
    reach: (areaIds: readonly string[]) =>
      request<ReachEstimateDto>(
        areaIds.length
          ? `/warnings/reach?${areaIds.map((areaId) => `areaIds=${encodePath(areaId)}`).join('&')}`
          : '/warnings/reach',
      ),
    saveDraft: (body: SubmitWarningRequestDto) =>
      request<WarningDto>('/warnings/drafts', send('POST', body)),
    publish: (body: SubmitWarningRequestDto) =>
      request<WarningDeliveryResultDto>(
        '/warnings/publish',
        send('POST', body),
      ),
    update: (warningId: string, body: UpdateWarningRequestDto) =>
      request<WarningDeliveryResultDto>(
        `/warnings/${encodePath(warningId)}`,
        send('PATCH', body),
      ),
    cancel: (warningId: string, body: CancelWarningRequestDto) =>
      request<WarningDto>(
        `/warnings/${encodePath(warningId)}/cancel`,
        send('POST', body),
      ),
    deliveries: (warningId: string) =>
      request<DeliveryRecordDto[]>(
        `/warnings/${encodePath(warningId)}/deliveries`,
      ),
    retryDelivery: (recordId: string) =>
      request<DeliveryRecordDto>(
        `/warnings/deliveries/${encodePath(recordId)}/retry`,
        send('POST'),
      ),
  },
  hazardReports: {
    list: () => request<HazardReportDto[]>('/hazard-reports'),
  },
  incidents: {
    list: () => request<IncidentDto[]>('/response/incidents'),
  },
};
