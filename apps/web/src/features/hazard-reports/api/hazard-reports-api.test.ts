import { describe, expect, it, vi } from 'vitest';
import { createDistrictsApi } from './districts-api';
import { createHazardReportsApi, type Requester } from './hazard-reports-api';

function setup() {
  const send = vi.fn().mockResolvedValue({ ok: true });
  const requester = send as unknown as Requester;
  return {
    send,
    api: createHazardReportsApi(requester),
    districts: createDistrictsApi(requester),
  };
}

const report = {
  hazardType: 'flood',
  description: 'Water is rising',
  location: { latitude: 6.9, longitude: 79.8 },
  district: 'd1',
  capturedAt: '2026-10-08T10:00:00.000Z',
  reporterId: 'citizen-nimal',
  reporterRole: 'citizen',
} as const;

describe('createHazardReportsApi', () => {
  it('submits a report with POST and a JSON body', async () => {
    const { send, api } = setup();
    await api.submit(report);
    expect(send).toHaveBeenCalledWith('/hazard-reports', {
      method: 'POST',
      body: JSON.stringify(report),
    });
  });

  it('queues a report offline', async () => {
    const { send, api } = setup();
    await api.queueOffline(report);
    expect(send).toHaveBeenCalledWith('/hazard-reports/offline', {
      method: 'POST',
      body: JSON.stringify(report),
    });
  });

  it('syncs with POST and no body', async () => {
    const { send, api } = setup();
    await api.sync();
    expect(send).toHaveBeenCalledWith('/hazard-reports/sync', {
      method: 'POST',
      body: undefined,
    });
  });

  it('lists the pending reports', async () => {
    const { send, api } = setup();
    await api.listPending();
    expect(send).toHaveBeenCalledWith('/hazard-reports');
  });

  it("lists one reporter's reports, with the id made safe for a URL", async () => {
    const { send, api } = setup();
    await api.listByReporter('citizen & co');
    expect(send).toHaveBeenCalledWith(
      '/hazard-reports?reporterId=citizen%20%26%20co',
    );
  });

  it('gets one report by id', async () => {
    const { send, api } = setup();
    await api.getById('abc123');
    expect(send).toHaveBeenCalledWith('/hazard-reports/abc123');
  });

  it('verifies with PATCH and the operator id', async () => {
    const { send, api } = setup();
    await api.verify('abc123', 'operator-kj');
    expect(send).toHaveBeenCalledWith('/hazard-reports/abc123/verify', {
      method: 'PATCH',
      body: JSON.stringify({ operatorId: 'operator-kj' }),
    });
  });

  it('rejects with PATCH, the operator id and the reason', async () => {
    const { send, api } = setup();
    await api.reject('abc123', 'operator-kj', 'Not a hazard');
    expect(send).toHaveBeenCalledWith('/hazard-reports/abc123/reject', {
      method: 'PATCH',
      body: JSON.stringify({
        operatorId: 'operator-kj',
        reason: 'Not a hazard',
      }),
    });
  });

  it('passes an error from the requester on to the caller', async () => {
    const send = vi.fn().mockRejectedValue(new Error('boom'));
    const api = createHazardReportsApi(send as unknown as Requester);
    await expect(api.getById('x')).rejects.toThrow('boom');
  });
});

describe('createDistrictsApi', () => {
  it('lists the districts', async () => {
    const { send, districts } = setup();
    await districts.list();
    expect(send).toHaveBeenCalledWith('/districts');
  });
});
