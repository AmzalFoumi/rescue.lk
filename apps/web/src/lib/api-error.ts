import type { WarningFormErrors } from '@rescue-lk/shared';

export interface ApiErrorInit {
  status: number;
  message: string;
  fieldErrors?: WarningFormErrors;
  details?: string[];
  cause?: unknown;
}

type JsonObject = Record<string, unknown>;

const isObject = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

// class-validator messages start with the property they are about, e.g.
// "severity must be one of ..." or "each value in channels must be ...".
const VALIDATION_MESSAGE_FIELD = /^(?:each value in )?([A-Za-z]\w*)\b/;

// Files each ValidationPipe message under its field; the first message wins.
const fieldsFromDetails = (details: readonly string[]): WarningFormErrors => {
  const errors: Record<string, string> = {};
  for (const detail of details) {
    const field = VALIDATION_MESSAGE_FIELD.exec(detail)?.[1];
    if (field && !(field in errors)) {
      errors[field] = detail;
    }
  }
  return errors;
};

const stringEntries = (value: unknown): WarningFormErrors =>
  isObject(value)
    ? Object.fromEntries(
        Object.entries(value).filter(([, text]) => typeof text === 'string'),
      )
    : {};

// An API failure the UI can show: the HTTP status, a readable message, and for
// warning form errors one message per field.
//
// The API's AllExceptionsFilter answers { statusCode, timestamp, path, message }
// where message is one of:
//   'text'                               (unexpected 500)
//   { message: 'text', error }           (404, 409, 422)
//   { message: ['text', ...], error }    (ValidationPipe 400)
//   { message: 'text', errors: {...} }   (InvalidWarningException 400)
export class ApiError extends Error {
  // fetch itself failed: the server could not be reached.
  static readonly NETWORK_ERROR_STATUS = 0;

  readonly status: number;
  readonly fieldErrors: WarningFormErrors;
  readonly details: string[];

  constructor({
    status,
    message,
    fieldErrors = {},
    details = [],
    cause,
  }: ApiErrorInit) {
    super(message, { cause });
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.details = details;
  }

  static fromResponse(status: number, body: unknown): ApiError {
    const fallback = `Request failed with status ${status}`;
    if (typeof body === 'string' && body.trim()) {
      return new ApiError({ status, message: body.trim() });
    }
    const detail = isObject(body) ? body.message : undefined;
    if (typeof detail === 'string') {
      return new ApiError({ status, message: detail });
    }
    if (!isObject(detail)) {
      return new ApiError({ status, message: fallback });
    }

    const details = isStringArray(detail.message) ? detail.message : [];
    const message =
      typeof detail.message === 'string'
        ? detail.message
        : (details[0] ?? fallback);
    return new ApiError({
      status,
      message,
      details,
      fieldErrors: {
        ...fieldsFromDetails(details),
        ...stringEntries(detail.errors),
      },
    });
  }

  // Any thrown value as an ApiError; a non-ApiError means the request never
  // got an answer (network failure), and the original is kept as the cause.
  static from(error: unknown): ApiError {
    if (error instanceof ApiError) {
      return error;
    }
    const reason = error instanceof Error ? error.message : String(error);
    return new ApiError({
      status: ApiError.NETWORK_ERROR_STATUS,
      message: `Could not reach the server: ${reason}`,
      cause: error,
    });
  }
}
