import { describe, it, expect } from 'vitest';
import { ApiError } from './api-error';

// Bodies as written by the API's AllExceptionsFilter:
// { statusCode, timestamp, path, message: <exception response> }.
const envelope = (status: number, message: unknown) => ({
  statusCode: status,
  timestamp: '2026-10-08T12:00:00.000Z',
  path: '/api/warnings/publish',
  message,
});

describe('ApiError.fromResponse', () => {
  it('reads per-field errors from an InvalidWarningException body', () => {
    const errors = {
      message: 'Write a message of at least 20 characters.',
      channels: 'Select at least one channel.',
    };

    const error = ApiError.fromResponse(
      400,
      envelope(400, { message: 'Warning failed validation', errors }),
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(400);
    expect(error.message).toBe('Warning failed validation');
    expect(error.fieldErrors).toEqual(errors);
    expect(error.details).toEqual([]);
  });

  it('keeps only string field errors', () => {
    const error = ApiError.fromResponse(
      400,
      envelope(400, {
        message: 'Warning failed validation',
        errors: { message: 'Too short.', channels: 42 },
      }),
    );

    expect(error.fieldErrors).toEqual({ message: 'Too short.' });
  });

  it('reads the list of messages from a ValidationPipe body', () => {
    const details = ['channels must be one of SMS, PUSH, SIREN'];

    const error = ApiError.fromResponse(
      400,
      envelope(400, { message: details, error: 'Bad Request' }),
    );

    expect(error.message).toBe(details[0]);
    expect(error.details).toEqual(details);
    expect(error.fieldErrors).toEqual({ channels: details[0] });
  });

  it('also files each ValidationPipe message under the field it names', () => {
    const error = ApiError.fromResponse(
      400,
      envelope(400, {
        message: [
          'severity must be one of the following values: CRITICAL, HIGH, MEDIUM, LOW',
          'each value in channels must be one of the following values: SMS, PUSH, SIREN',
          'sourceReportId must be a mongodb id',
          'sourceReportId should not be empty',
        ],
        error: 'Bad Request',
      }),
    );

    expect(error.fieldErrors).toEqual({
      severity:
        'severity must be one of the following values: CRITICAL, HIGH, MEDIUM, LOW',
      channels:
        'each value in channels must be one of the following values: SMS, PUSH, SIREN',
      sourceReportId: 'sourceReportId must be a mongodb id',
    });
  });

  it('reads the message of a Nest exception (404/409/422)', () => {
    const error = ApiError.fromResponse(
      409,
      envelope(409, {
        message: 'Cannot cancel warning W: it is CANCELLED',
        error: 'Conflict',
      }),
    );

    expect(error.status).toBe(409);
    expect(error.message).toBe('Cannot cancel warning W: it is CANCELLED');
  });

  it('reads a plain string message (500)', () => {
    const error = ApiError.fromResponse(
      500,
      envelope(500, 'Internal server error'),
    );

    expect(error.message).toBe('Internal server error');
  });

  it('falls back to a generic message for an unknown body', () => {
    expect(ApiError.fromResponse(502, null).message).toBe(
      'Request failed with status 502',
    );
    expect(
      ApiError.fromResponse(400, envelope(400, { message: [] })).message,
    ).toBe('Request failed with status 400');
  });

  it('uses a non-JSON text body as the message', () => {
    expect(ApiError.fromResponse(502, 'Bad gateway').message).toBe(
      'Bad gateway',
    );
  });
});

describe('ApiError.from', () => {
  it('returns an ApiError unchanged', () => {
    const original = new ApiError({ status: 404, message: 'Not found' });

    expect(ApiError.from(original)).toBe(original);
  });

  it('wraps a network failure with status 0 and keeps the cause', () => {
    const cause = new TypeError('Failed to fetch');

    const error = ApiError.from(cause);

    expect(error.status).toBe(ApiError.NETWORK_ERROR_STATUS);
    expect(error.message).toContain('Failed to fetch');
    expect(error.cause).toBe(cause);
  });

  it('wraps a non-Error value as text', () => {
    expect(ApiError.from('boom').message).toContain('boom');
  });
});
