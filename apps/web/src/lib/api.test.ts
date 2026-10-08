import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  NETWORK_ERROR_MESSAGE,
  api,
  readErrorMessages,
  request,
} from './api';

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

describe('api', () => {
  it('lists warnings and incidents from their paths', async () => {
    const fetchMock = vi.fn(() => respond(200, []));
    vi.stubGlobal('fetch', fetchMock);

    await api.warnings.list();
    await api.incidents.list();

    const urls = fetchMock.mock.calls.map(
      (call) => (call as unknown as [string])[0],
    );
    expect(urls[0]).toMatch(/\/warnings$/);
    expect(urls[1]).toMatch(/\/response\/incidents$/);
  });
});
