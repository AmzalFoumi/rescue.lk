import { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import type { AlertChannelType } from '@rescue-lk/shared';
import { WarningDeliveryService } from './warning-delivery.service.js';
import { RetryPolicy } from './retry.policy.js';
import { ChannelRegistry } from '../channels/channel.registry.js';
import type {
  AlertChannel,
  ChannelSendResult,
} from '../channels/alert-channel.interface.js';
import type {
  CreateDeliveryRecordInput,
  DeliveryRecordChanges,
  DeliveryRecordEntry,
  DeliveryRecordsRepository,
} from '../delivery-records.repository.interface.js';
import { INITIAL_DELIVERY_ATTEMPTS } from '../warnings.constants.js';
import {
  FIXED_NOW,
  WARNING_ID,
  buildWarningRecord,
  fixedClock,
} from '../testing/warning.fixtures.js';

const MAX_SEND_ATTEMPTS = 3;
const SENT: ChannelSendResult = { success: true };
const failed = (failureReason: string): ChannelSendResult => ({
  success: false,
  failureReason,
});

// In-memory repository so the test can inspect what was persisted.
class FakeDeliveryRecordsRepository implements DeliveryRecordsRepository {
  readonly records = new Map<string, DeliveryRecordEntry>();
  readonly failingUpdates = new Set<string>();
  readonly vanishedRecords = new Set<string>();

  create(input: CreateDeliveryRecordInput): Promise<DeliveryRecordEntry> {
    const record: DeliveryRecordEntry = {
      id: `record-${input.channel}`,
      ...input,
      status: 'pending',
      attempts: INITIAL_DELIVERY_ATTEMPTS,
    };
    this.records.set(record.id, record);
    return Promise.resolve({ ...record });
  }

  findByWarningId(warningId: string): Promise<DeliveryRecordEntry[]> {
    return Promise.resolve(
      [...this.records.values()].filter(
        (record) => record.warningId === warningId,
      ),
    );
  }

  update(
    id: string,
    changes: DeliveryRecordChanges,
  ): Promise<DeliveryRecordEntry | null> {
    if (this.failingUpdates.has(id)) {
      return Promise.reject(new Error(`db write failed for ${id}`));
    }
    const existing = this.records.get(id);
    if (!existing || this.vanishedRecords.has(id)) {
      return Promise.resolve(null);
    }
    const updated = { ...existing, ...changes };
    this.records.set(id, updated);
    return Promise.resolve({ ...updated });
  }
}

const fakeChannel = (type: AlertChannelType) => {
  const send = vi.fn<AlertChannel['send']>().mockResolvedValue(SENT);
  return { type, send } satisfies AlertChannel;
};

const sentEntry = (channel: AlertChannelType, attempts = 1) => ({
  id: `record-${channel}`,
  warningId: WARNING_ID,
  channel,
  status: 'sent',
  attempts,
  lastAttemptAt: FIXED_NOW,
});

describe('WarningDeliveryService (step 10 deliver, par fragment)', () => {
  const warning = buildWarningRecord({ channels: ['push', 'sms', 'audible'] });
  let repository: FakeDeliveryRecordsRepository;
  let push: ReturnType<typeof fakeChannel>;
  let sms: ReturnType<typeof fakeChannel>;
  let audible: ReturnType<typeof fakeChannel>;
  let service: WarningDeliveryService;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    repository = new FakeDeliveryRecordsRepository();
    push = fakeChannel('push');
    sms = fakeChannel('sms');
    audible = fakeChannel('audible');
    const config = {
      getOrThrow: () => MAX_SEND_ATTEMPTS,
    } as unknown as ConfigService;
    service = new WarningDeliveryService(
      repository,
      new ChannelRegistry([push, sms, audible]),
      new RetryPolicy(config),
      fixedClock,
    );
    vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    errorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('records every channel as sent when all channels succeed', async () => {
    const createSpy = vi.spyOn(repository, 'create');

    const records = await service.deliver(warning);

    expect(createSpy.mock.calls).toEqual([
      [{ warningId: WARNING_ID, channel: 'push' }],
      [{ warningId: WARNING_ID, channel: 'sms' }],
      [{ warningId: WARNING_ID, channel: 'audible' }],
    ]);
    expect(records).toEqual([
      sentEntry('push'),
      sentEntry('sms'),
      sentEntry('audible'),
    ]);
    expect(push.send).toHaveBeenCalledWith(warning);
  });

  it('only sends on the channels selected for the warning', async () => {
    await service.deliver(buildWarningRecord({ channels: ['sms'] }));

    expect(sms.send).toHaveBeenCalledTimes(1);
    expect(push.send).not.toHaveBeenCalled();
    expect(audible.send).not.toHaveBeenCalled();
  });

  it('records a channel as sent when it fails once then succeeds on retry', async () => {
    sms.send.mockResolvedValueOnce(failed('timeout'));

    const records = await service.deliver(warning);

    expect(records[1]).toEqual(sentEntry('sms', 2));
  });

  it('records a channel as failed with its reason when every attempt fails, while the others are still sent', async () => {
    sms.send.mockResolvedValue(failed('gateway unavailable'));

    const records = await service.deliver(warning);

    expect(records).toEqual([
      sentEntry('push'),
      {
        ...sentEntry('sms', MAX_SEND_ATTEMPTS),
        status: 'failed',
        failureReason: 'gateway unavailable',
      },
      sentEntry('audible'),
    ]);
    expect(sms.send).toHaveBeenCalledTimes(MAX_SEND_ATTEMPTS);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('sms'));
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining(WARNING_ID));
  });

  it('records a channel that throws as failed without affecting the others', async () => {
    audible.send.mockRejectedValue(new Error('siren controller offline'));

    const records = await service.deliver(warning);

    expect(records.map((record) => record.status)).toEqual([
      'sent',
      'sent',
      'failed',
    ]);
    expect(records[2].failureReason).toBe('siren controller offline');
  });

  it('sends on all channels in parallel', async () => {
    const pendingSends: ((result: ChannelSendResult) => void)[] = [];
    const deferredSend = () =>
      new Promise<ChannelSendResult>((resolve) => pendingSends.push(resolve));
    for (const channel of [push, sms, audible]) {
      channel.send.mockImplementation(deferredSend);
    }

    const delivering = service.deliver(warning);

    // If sends ran one after another, only the first would have started here.
    await vi.waitFor(() => expect(pendingSends).toHaveLength(3));
    pendingSends.forEach((resolve) => resolve(SENT));
    await expect(delivering).resolves.toHaveLength(3);
  });

  it('finishes the other channels, then logs and rethrows when recording one delivery fails', async () => {
    repository.failingUpdates.add('record-sms');

    await expect(service.deliver(warning)).rejects.toThrow(
      'db write failed for record-sms',
    );
    expect(repository.records.get('record-push')?.status).toBe('sent');
    expect(repository.records.get('record-audible')?.status).toBe('sent');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('sms'),
      expect.any(String),
    );
  });

  it('rethrows every recording failure together as an AggregateError', async () => {
    repository.failingUpdates.add('record-push');
    repository.failingUpdates.add('record-sms');

    const error = await service.deliver(warning).catch((caught) => caught);

    expect(error).toBeInstanceOf(AggregateError);
    expect((error as AggregateError).errors).toHaveLength(2);
  });

  it('logs and rethrows a non-Error recording failure unchanged', async () => {
    vi.spyOn(repository, 'update').mockRejectedValueOnce('connection reset');

    await expect(service.deliver(warning)).rejects.toBe('connection reset');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('push'),
      'connection reset',
    );
  });

  it('fails when a delivery record disappears before it can be updated', async () => {
    repository.vanishedRecords.add('record-push');

    await expect(service.deliver(warning)).rejects.toThrow('record-push');
  });
});
