import type { WarningDto } from '@rescue-lk/shared';

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

// Warnings (UC1) still uses this. Hazard reports and districts live in
// src/features/hazard-reports/api, response coordination in
// src/features/response/api.
export const api = {
  warnings: {
    list: () => request<WarningDto[]>('/warnings'),
  },
};
