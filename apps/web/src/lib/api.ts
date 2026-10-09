import type {
  CancelWarningRequestDto,
  DeliveryRecordDto,
  ReachEstimateDto,
  SubmitWarningRequestDto,
  TargetAreaDto,
  UpdateWarningRequestDto,
  VerifiedHazardReportDto,
  WarningDeliveryResultDto,
  WarningDto,
  WarningStatus,
} from '@rescue-lk/shared';
import { ApiError as WarningsApiError } from './api-error';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

/** Shown when the request never reached the API (no network, server down). */
export const NETWORK_ERROR_MESSAGE =
  'Could not reach the server. Check your connection and try again.';

/** A failed API call. `messages` are readable lines the UI can show. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly messages: string[],
  ) {
    super(messages.join(' '));
    this.name = 'ApiError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Finds the readable messages in an error body from the API.
 * The API sends `{ message: "text" }`, or for validation errors
 * `{ message: { message: ["text", ...] } }`.
 */
export function readErrorMessages(body: unknown): string[] {
  if (typeof body === 'string') return [body];
  if (Array.isArray(body))
    return body.filter((item): item is string => typeof item === 'string');
  if (isRecord(body)) return readErrorMessages(body.message);
  return [];
}

/** Readable text for anything that was thrown, safe to show to the user. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.messages.join(' ');
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      // Only requests with a body need the header (it avoids extra browser pre-checks on GET).
      headers: {
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(0, [NETWORK_ERROR_MESSAGE]);
  }

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => undefined);
    const messages = readErrorMessages(body);
    throw new ApiError(
      response.status,
      messages.length > 0
        ? messages
        : [`The request failed (status ${response.status}).`],
    );
  }

  return response.json() as Promise<T>;
}

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

// UC1 warnings client. Exception mapping in one place (errors use ./api-error): a network failure or HTTP error always becomes an
// ApiError, so hooks never read status codes or parse error bodies themselves.
async function warningsRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch (error) {
    throw WarningsApiError.from(error);
  }

  const body = await readBody(response);
  if (!response.ok) {
    throw WarningsApiError.fromResponse(response.status, body);
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
  warnings: {
    list: (status?: WarningStatus) =>
      warningsRequest<WarningDto[]>(
        status ? `/warnings?status=${encodePath(status)}` : '/warnings',
      ),
    verifiedReports: () =>
      warningsRequest<VerifiedHazardReportDto[]>('/warnings/verified-reports'),
    targetAreas: () =>
      warningsRequest<TargetAreaDto[]>('/warnings/target-areas'),
    reach: (areaIds: readonly string[]) =>
      warningsRequest<ReachEstimateDto>(
        areaIds.length
          ? `/warnings/reach?${areaIds.map((areaId) => `areaIds=${encodePath(areaId)}`).join('&')}`
          : '/warnings/reach',
      ),
    saveDraft: (body: SubmitWarningRequestDto) =>
      warningsRequest<WarningDto>('/warnings/drafts', send('POST', body)),
    publish: (body: SubmitWarningRequestDto) =>
      warningsRequest<WarningDeliveryResultDto>(
        '/warnings/publish',
        send('POST', body),
      ),
    update: (warningId: string, body: UpdateWarningRequestDto) =>
      warningsRequest<WarningDeliveryResultDto>(
        `/warnings/${encodePath(warningId)}`,
        send('PATCH', body),
      ),
    cancel: (warningId: string, body: CancelWarningRequestDto) =>
      warningsRequest<WarningDto>(
        `/warnings/${encodePath(warningId)}/cancel`,
        send('POST', body),
      ),
    deliveries: (warningId: string) =>
      warningsRequest<DeliveryRecordDto[]>(
        `/warnings/${encodePath(warningId)}/deliveries`,
      ),
    retryDelivery: (recordId: string) =>
      warningsRequest<DeliveryRecordDto>(
        `/warnings/deliveries/${encodePath(recordId)}/retry`,
        send('POST'),
      ),
  },
};

import type {
  DemoRole,
  ExportFormat,
  ReportType,
  TabularReportData,
} from '@rescue-lk/shared';

export interface ReportRequest {
  type: ReportType;
  from: string;
  to: string;
  hazardType?: string;
  district?: string;
}

function headersFor(role: DemoRole): HeadersInit {
  return { 'Content-Type': 'application/json', 'x-demo-role': role };
}

export async function getVisibleReportTypes(
  role: DemoRole,
): Promise<ReportType[]> {
  const res = await request<ReportType[]>('/analytics/report-types', {
    headers: headersFor(role),
  });
  return res;
}

export async function generateReport(
  requestBody: ReportRequest,
  role: DemoRole,
): Promise<TabularReportData> {
  const res = await request<TabularReportData>('/analytics/reports', {
    method: 'POST',
    headers: headersFor(role),
    body: JSON.stringify(requestBody),
  });
  return res;
}

export async function exportReport(
  requestBody: ReportRequest & { format: ExportFormat },
  role: DemoRole,
): Promise<Blob> {
  const res = await fetch(`${API_URL}/analytics/reports/export`, {
    method: 'POST',
    headers: headersFor(role),
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    throw new Error(`Failed to export report (${res.status})`);
  }

  return res.blob();
}
