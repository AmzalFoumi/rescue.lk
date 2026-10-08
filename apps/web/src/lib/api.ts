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

const id = (value: string) => encodeURIComponent(value);

export const api = {
  districts: {
    list: () => request<DistrictDto[]>('/districts'),
  },
  warnings: {
    list: (status?: WarningStatus) =>
      request<WarningDto[]>(
        status ? `/warnings?status=${id(status)}` : '/warnings',
      ),
    verifiedReports: () =>
      request<VerifiedHazardReportDto[]>('/warnings/verified-reports'),
    targetAreas: () => request<TargetAreaDto[]>('/warnings/target-areas'),
    reach: (areaIds: readonly string[]) =>
      request<ReachEstimateDto>(
        areaIds.length
          ? `/warnings/reach?${areaIds.map((areaId) => `areaIds=${id(areaId)}`).join('&')}`
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
        `/warnings/${id(warningId)}`,
        send('PATCH', body),
      ),
    cancel: (warningId: string, body: CancelWarningRequestDto) =>
      request<WarningDto>(
        `/warnings/${id(warningId)}/cancel`,
        send('POST', body),
      ),
    deliveries: (warningId: string) =>
      request<DeliveryRecordDto[]>(`/warnings/${id(warningId)}/deliveries`),
    retryDelivery: (recordId: string) =>
      request<DeliveryRecordDto>(
        `/warnings/deliveries/${id(recordId)}/retry`,
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
