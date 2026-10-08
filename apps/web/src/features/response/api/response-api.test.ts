import { describe, beforeEach, it, expect, vi } from 'vitest';
import { createDistrictsApi } from './districts-api';
import { createResponseApi, type Requester } from './response-api';

describe('createResponseApi', () => {
  let send: Requester;
  let calls: Array<[string, RequestInit | undefined]>;

  beforeEach(() => {
    calls = [];
    send = vi.fn(async (path: string, init?: RequestInit) => {
      calls.push([path, init]);
      return undefined as never;
    });
  });

  function lastBody() {
    const [, init] = calls[calls.length - 1];
    return JSON.parse(String(init?.body)) as Record<string, unknown>;
  }

  it('reads the reports that need a response', async () => {
    await createResponseApi(send).listReports();
    expect(calls[0][0]).toBe('/response/reports');
  });

  it('asks for every team when no filter is given', async () => {
    await createResponseApi(send).listTeams();
    expect(calls[0][0]).toBe('/response/teams');
  });

  it('puts only the filters that are set in the query', async () => {
    const api = createResponseApi(send);

    await api.listTeams({ district: 'd-kan' });
    expect(calls[0][0]).toBe('/response/teams?district=d-kan');

    await api.listTeams({ district: 'd-kan', status: 'available' });
    expect(calls[1][0]).toBe('/response/teams?district=d-kan&status=available');
  });

  it('posts the report, the team and the officer when dispatching', async () => {
    await createResponseApi(send).dispatch('r1', 't1', 'officer-sp');

    expect(calls[0][0]).toBe('/response/dispatches');
    expect(calls[0][1]?.method).toBe('POST');
    expect(lastBody()).toEqual({
      reportId: 'r1',
      teamId: 't1',
      officerId: 'officer-sp',
    });
  });

  it('reads the dispatches of one report', async () => {
    await createResponseApi(send).listDispatchesForReport('r 1');
    expect(calls[0][0]).toBe('/response/dispatches/report/r%201');
  });

  it('patches a team status', async () => {
    await createResponseApi(send).changeTeamStatus('t1', 'returning');

    expect(calls[0][0]).toBe('/response/teams/t1/status');
    expect(calls[0][1]?.method).toBe('PATCH');
    expect(lastBody()).toEqual({ status: 'returning' });
  });

  it('patches an occupancy change, keeping the sign', async () => {
    const api = createResponseApi(send);

    await api.changeOccupancy('s1', 25);
    expect(lastBody()).toEqual({ people: 25 });

    await api.changeOccupancy('s1', -10);
    expect(lastBody()).toEqual({ people: -10 });
  });

  it('reads shelters and relief, by district when asked', async () => {
    const api = createResponseApi(send);

    await api.listShelters();
    expect(calls[0][0]).toBe('/response/shelters');

    await api.listShelters('d-kan');
    expect(calls[1][0]).toBe('/response/shelters?district=d-kan');

    await api.listRelief('d-col');
    expect(calls[2][0]).toBe('/response/relief?district=d-col');
  });

  it('posts a relief distribution', async () => {
    await createResponseApi(send).logRelief({
      item: 'water',
      quantity: 500,
      district: 'd-kan',
      owner: { organisationId: 'o1', name: 'Red Cross', kind: 'ngo' },
    });

    expect(calls[0][0]).toBe('/response/relief');
    expect(lastBody()).toMatchObject({ item: 'water', quantity: 500 });
  });
});

describe('createDistrictsApi', () => {
  it('reads the districts', async () => {
    const send = vi.fn(async () => undefined as never);
    await createDistrictsApi(send).list();
    expect(send).toHaveBeenCalledWith('/districts');
  });
});
