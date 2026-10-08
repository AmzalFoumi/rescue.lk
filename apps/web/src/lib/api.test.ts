import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import type { SubmitWarningRequestDto } from '@rescue-lk/shared';
import { api } from './api';
import { ApiError } from './api-error';

const API_URL = 'http://localhost:3000/api';
const WARNING_ID = '665f1b2c9d3e4a0012345670';
const RECORD_ID = '665f1b2c9d3e4a0012345671';

const submit: SubmitWarningRequestDto = {
  sourceReportId: '665f1b2c9d3e4a00000000a1',
  hazard: 'FLOOD',
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

  it('throws an ApiError with the field errors on a 400', async () => {
    const errors = { channels: 'Select at least one channel.' };
    fetchMock.mockResolvedValue(
      jsonResponse(400, {
        statusCode: 400,
        message: { message: 'Warning failed validation', errors },
      }),
    );

    const error = await api.warnings.publish(submit).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(400);
    expect((error as ApiError).fieldErrors).toEqual(errors);
  });

  it('throws an ApiError with the text of a non-JSON error body', async () => {
    fetchMock.mockResolvedValue(new Response('Bad gateway', { status: 502 }));

    await expect(api.warnings.list()).rejects.toMatchObject({
      status: 502,
      message: 'Bad gateway',
    });
  });

  it('throws a network ApiError when the server cannot be reached', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(api.warnings.list()).rejects.toMatchObject({
      status: ApiError.NETWORK_ERROR_STATUS,
    });
  });
});
