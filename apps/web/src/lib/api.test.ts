import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SubmitWarningRequestDto } from '@rescue-lk/shared';
import {
  ApiError,
  NETWORK_ERROR_MESSAGE,
  api,
  errorMessage,
  readErrorMessages,
  request,
} from './api';
import { ApiError as WarningsApiError } from './api-error';

function respond(status: number, body: unknown) {
  return Promise.resolve(new Response(JSON.stringify(body), { status }));
}

afterEach(() => vi.unstubAllGlobals());

describe('readErrorMessages', () => {
  it('reads a plain message', () => {
    expect(readErrorMessages({ message: 'Not found' })).toEqual(['Not found']);
  });

  it('reads the nested validation messages the API sends', () => {
    const body = {
      statusCode: 400,
      message: {
        message: [
          'description should not be empty',
          'district must be a mongodb id',
        ],
      },
    };
    expect(readErrorMessages(body)).toEqual([
      'description should not be empty',
      'district must be a mongodb id',
    ]);
  });

  it('returns nothing for a body it does not understand', () => {
    expect(readErrorMessages(undefined)).toEqual([]);
    expect(readErrorMessages(42)).toEqual([]);
  });

  it('ignores non-text entries in a message list', () => {
    expect(readErrorMessages(['ok', 7, null])).toEqual(['ok']);
  });
});

describe('request', () => {
  it('returns the parsed body of a successful call', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => respond(200, [{ id: '1' }])),
    );
    expect(await request('/things')).toEqual([{ id: '1' }]);
  });

  it('sends the JSON header only when there is a body', async () => {
    const fetchMock = vi.fn(() => respond(200, {}));
    vi.stubGlobal('fetch', fetchMock);

    await request('/things');
    await request('/things', { method: 'POST', body: '{}' });

    const [, getInit] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    const [, postInit] = fetchMock.mock.calls[1] as unknown as [
      string,
      RequestInit,
    ];
    expect(getInit.headers).toEqual({});
    expect(postInit.headers).toEqual({ 'Content-Type': 'application/json' });
  });

  it('throws an ApiError with the status and the validation messages', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => respond(400, { message: { message: ['a', 'b'] } })),
    );
    const error = await request('/things').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(400);
    expect((error as ApiError).messages).toEqual(['a', 'b']);
  });

  it('falls back to a generic message when the error body is empty', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('oops', { status: 500 }))),
    );
    const error = (await request('/things').catch(
      (e: unknown) => e,
    )) as ApiError;
    expect(error.messages).toEqual(['The request failed (status 500).']);
  });

  it('turns a network failure into an ApiError with status 0', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
    );
    const error = (await request('/things').catch(
      (e: unknown) => e,
    )) as ApiError;
    expect(error.status).toBe(0);
    expect(error.messages).toEqual([NETWORK_ERROR_MESSAGE]);
  });
});

describe('errorMessage', () => {
  it('joins the messages of an ApiError', () => {
    expect(errorMessage(new ApiError(400, ['a', 'b']))).toBe('a b');
  });

  it('uses the message of a normal Error', () => {
    expect(errorMessage(new Error('boom'))).toBe('boom');
  });

  it('has a friendly fallback for anything else', () => {
    expect(errorMessage('oops')).toBe(
      'Something went wrong. Please try again.',
    );
  });
});

const API_URL = 'http://localhost:3000/api';
const WARNING_ID = '665f1b2c9d3e4a0012345670';
const RECORD_ID = '665f1b2c9d3e4a0012345671';

const submit: SubmitWarningRequestDto = {
  sourceReportId: '665f1b2c9d3e4a00000000a1',
  hazard: 'flood',
  severity: 'HIGH',
  areaIds: ['B-KALU'],
  message: 'The Kalu Ganga is rising quickly near Ratnapura.',
  createdBy: 'Assessment Officer',
};

const jsonResponse = (status: number, body: unknown) =>
  new Response(body === undefined ? '' : JSON.stringify(body), { status });

describe('api.warnings', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, []));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const lastCall = () => {
    const [url, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
    return {
      url,
      method: init.method ?? 'GET',
      body: init.body ? JSON.parse(init.body as string) : undefined,
    };
  };

  it.each([
    ['list()', () => api.warnings.list(), 'GET', '/warnings'],
    [
      "list('ACTIVE')",
      () => api.warnings.list('ACTIVE'),
      'GET',
      '/warnings?status=ACTIVE',
    ],
    [
      'verifiedReports()',
      () => api.warnings.verifiedReports(),
      'GET',
      '/warnings/verified-reports',
    ],
    [
      'targetAreas()',
      () => api.warnings.targetAreas(),
      'GET',
      '/warnings/target-areas',
    ],
    ['reach([])', () => api.warnings.reach([]), 'GET', '/warnings/reach'],
    [
      'reach(areaIds)',
      () => api.warnings.reach(['B-KALU', 'D-NUWARA ELIYA']),
      'GET',
      '/warnings/reach?areaIds=B-KALU&areaIds=D-NUWARA%20ELIYA',
    ],
    [
      'deliveries(id)',
      () => api.warnings.deliveries(WARNING_ID),
      'GET',
      `/warnings/${WARNING_ID}/deliveries`,
    ],
    [
      'retryDelivery(recordId)',
      () => api.warnings.retryDelivery(RECORD_ID),
      'POST',
      `/warnings/deliveries/${RECORD_ID}/retry`,
    ],
  ])('%s calls %s %s', async (_name, call, method, path) => {
    await call();

    expect(lastCall()).toMatchObject({ url: `${API_URL}${path}`, method });
  });

  it('saveDraft posts the form to /warnings/drafts', async () => {
    await api.warnings.saveDraft(submit);

    expect(lastCall()).toEqual({
      url: `${API_URL}/warnings/drafts`,
      method: 'POST',
      body: submit,
    });
  });

  it('publish posts the form to /warnings/publish', async () => {
    await api.warnings.publish({ ...submit, draftId: WARNING_ID });

    expect(lastCall()).toEqual({
      url: `${API_URL}/warnings/publish`,
      method: 'POST',
      body: { ...submit, draftId: WARNING_ID },
    });
  });

  it('update patches the warning', async () => {
    const content = {
      hazard: submit.hazard,
      severity: submit.severity,
      areaIds: submit.areaIds,
      message: submit.message,
    };

    await api.warnings.update(WARNING_ID, content);

    expect(lastCall()).toEqual({
      url: `${API_URL}/warnings/${WARNING_ID}`,
      method: 'PATCH',
      body: content,
    });
  });

  it('cancel posts the reason', async () => {
    await api.warnings.cancel(WARNING_ID, { reason: 'Water receding' });

    expect(lastCall()).toEqual({
      url: `${API_URL}/warnings/${WARNING_ID}/cancel`,
      method: 'POST',
      body: { reason: 'Water receding' },
    });
  });

  it('sends JSON and returns the parsed body', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, [{ id: WARNING_ID }]));

    await expect(api.warnings.list()).resolves.toEqual([{ id: WARNING_ID }]);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' });
  });

  it('throws a warnings ApiError with the field errors on a 400', async () => {
    const errors = { channels: 'Select at least one channel.' };
    fetchMock.mockResolvedValue(
      jsonResponse(400, {
        statusCode: 400,
        message: { message: 'Warning failed validation', errors },
      }),
    );

    const error = await api.warnings.publish(submit).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(WarningsApiError);
    expect((error as WarningsApiError).status).toBe(400);
    expect((error as WarningsApiError).fieldErrors).toEqual(errors);
  });

  it('throws a warnings ApiError with the text of a non-JSON error body', async () => {
    fetchMock.mockResolvedValue(new Response('Bad gateway', { status: 502 }));

    await expect(api.warnings.list()).rejects.toMatchObject({
      status: 502,
      message: 'Bad gateway',
    });
  });

  it('throws a network warnings ApiError when the server cannot be reached', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(api.warnings.list()).rejects.toMatchObject({
      status: WarningsApiError.NETWORK_ERROR_STATUS,
    });
  });
});
