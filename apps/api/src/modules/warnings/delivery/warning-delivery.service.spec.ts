import { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import {
  describe,
  beforeEach,
  afterEach,
  it,
  expect,
  vi,
  type Mocked,
} from 'vitest';
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
import type { WarningVersionRef } from '../delivery-records.repository.interface.js';
import { InMemoryTargetAreaCatalog } from '../target-areas/in-memory-target-area-catalog.js';
import type { WarningsRepository } from '../warnings.repository.interface.js';
import { DeliveryRecordNotFoundException } from '../exceptions/delivery-record-not-found.exception.js';
import { DeliveryNotRetryableException } from '../exceptions/delivery-not-retryable.exception.js';
import { WarningNotFoundException } from '../exceptions/warning-not-found.exception.js';
import {
  INITIAL_DELIVERY_ATTEMPTS,
  NO_ERROR,
  NO_RECIPIENTS,
} from '../warnings.constants.js';
import {
  FIXED_NOW,
  WARNING_ID,
  buildWarningRecord,
  fixedClock,
} from '../testing/warning.fixtures.js';

const MAX_SEND_ATTEMPTS = 3;
const RECIPIENTS = 1000;
const SENT: ChannelSendResult = { success: true, recipients: RECIPIENTS };
const failed = (error: string): ChannelSendResult => ({
  success: false,
  error,
});
// B-KALU (the fixture's area) resolves to these districts.
const KALU_DISTRICTS = ['Ratnapura', 'Kalutara'];

// In-memory repository so the test can inspect what was persisted.
class FakeDeliveryRecordsRepository implements DeliveryRecordsRepository {
  readonly records = new Map<string, DeliveryRecordEntry>();
  readonly failingUpdates = new Set<string>();
  readonly vanishedRecords = new Set<string>();

  seed(record: DeliveryRecordEntry): void {
    this.records.set(record.id, { ...record });
  }

  create(input: CreateDeliveryRecordInput): Promise<DeliveryRecordEntry> {
    const record: DeliveryRecordEntry = {
      id: `record-${input.channel}`,
      ...input,
      status: 'QUEUED',
      attempts: INITIAL_DELIVERY_ATTEMPTS,
      recipients: NO_RECIPIENTS,
      lastAttemptAt: null,
      error: NO_ERROR,
    };
    this.records.set(record.id, record);
    return Promise.resolve({ ...record });
  }

  findById(id: string): Promise<DeliveryRecordEntry | null> {
    const record = this.records.get(id);
    return Promise.resolve(record ? { ...record } : null);
  }

  findByWarningVersion({
    warningId,
    warningVersion,
  }: WarningVersionRef): Promise<DeliveryRecordEntry[]> {
    return Promise.resolve(
      [...this.records.values()].filter(
        (record) =>
          record.warningId === warningId &&
          record.warningVersion === warningVersion,
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
  return {
    type,
    send,
    estimateRecipients: () => RECIPIENTS,
  } satisfies AlertChannel;
};

const sentEntry = (
  channel: AlertChannelType,
  attempts = 1,
): DeliveryRecordEntry => ({
  id: `record-${channel}`,
  warningId: WARNING_ID,
  warningVersion: 1,
  channel,
  status: 'SENT',
  attempts,
  recipients: RECIPIENTS,
  lastAttemptAt: FIXED_NOW,
  error: NO_ERROR,
});

describe('WarningDeliveryService (step 10 deliver, par fragment)', () => {
  const warning = buildWarningRecord({ channels: ['PUSH', 'SMS', 'SIREN'] });
  let repository: FakeDeliveryRecordsRepository;
  let warningsRepository: Mocked<WarningsRepository>;
  let push: ReturnType<typeof fakeChannel>;
  let sms: ReturnType<typeof fakeChannel>;
  let siren: ReturnType<typeof fakeChannel>;
  let service: WarningDeliveryService;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    repository = new FakeDeliveryRecordsRepository();
    warningsRepository = {
      create: vi.fn(),
      findById: vi.fn().mockResolvedValue(warning),
      findAll: vi.fn(),
      update: vi.fn(),
    };
    push = fakeChannel('PUSH');
    sms = fakeChannel('SMS');
    siren = fakeChannel('SIREN');
    const config = {
      getOrThrow: () => MAX_SEND_ATTEMPTS,
    } as unknown as ConfigService;
    service = new WarningDeliveryService(
      repository,
      warningsRepository,
      new ChannelRegistry([push, sms, siren]),
      new RetryPolicy(config),
      new InMemoryTargetAreaCatalog(),
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
      [{ warningId: WARNING_ID, warningVersion: 1, channel: 'PUSH' }],
      [{ warningId: WARNING_ID, warningVersion: 1, channel: 'SMS' }],
      [{ warningId: WARNING_ID, warningVersion: 1, channel: 'SIREN' }],
    ]);
    expect(records).toEqual([
      sentEntry('PUSH'),
      sentEntry('SMS'),
      sentEntry('SIREN'),
    ]);
    expect(push.send).toHaveBeenCalledWith({
      warning,
      districts: KALU_DISTRICTS,
    });
  });

  it('only sends on the channels selected for the warning', async () => {
    await service.deliver(buildWarningRecord({ channels: ['SMS'] }));

    expect(sms.send).toHaveBeenCalledTimes(1);
    expect(push.send).not.toHaveBeenCalled();
    expect(siren.send).not.toHaveBeenCalled();
  });

  it('records a channel as sent when it fails once then succeeds on retry', async () => {
    sms.send.mockResolvedValueOnce(failed('timeout'));

    const records = await service.deliver(warning);

    expect(records[1]).toEqual(sentEntry('SMS', 2));
  });

  it('records a channel as failed with its reason when every attempt fails, while the others are still sent', async () => {
    sms.send.mockResolvedValue(failed('gateway unavailable'));

    const records = await service.deliver(warning);

    expect(records).toEqual([
      sentEntry('PUSH'),
      {
        ...sentEntry('SMS', MAX_SEND_ATTEMPTS),
        status: 'FAILED',
        recipients: NO_RECIPIENTS,
        error: 'gateway unavailable',
      },
      sentEntry('SIREN'),
    ]);
    expect(sms.send).toHaveBeenCalledTimes(MAX_SEND_ATTEMPTS);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('SMS'));
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining(WARNING_ID));
  });

  it('records a channel that throws as failed without affecting the others', async () => {
    siren.send.mockRejectedValue(new Error('siren controller offline'));

    const records = await service.deliver(warning);

    expect(records.map((record) => record.status)).toEqual([
      'SENT',
      'SENT',
      'FAILED',
    ]);
    expect(records[2].error).toBe('siren controller offline');
  });

  it('sends on all channels in parallel', async () => {
    const pendingSends: ((result: ChannelSendResult) => void)[] = [];
    const deferredSend = () =>
      new Promise<ChannelSendResult>((resolve) => pendingSends.push(resolve));
    for (const channel of [push, sms, siren]) {
      channel.send.mockImplementation(deferredSend);
    }

    const delivering = service.deliver(warning);

    // If sends ran one after another, only the first would have started here.
    await vi.waitFor(() => expect(pendingSends).toHaveLength(3));
    pendingSends.forEach((resolve) => resolve(SENT));
    await expect(delivering).resolves.toHaveLength(3);
  });

  it('finishes the other channels, then logs and rethrows when recording one delivery fails', async () => {
    repository.failingUpdates.add('record-SMS');

    await expect(service.deliver(warning)).rejects.toThrow(
      'db write failed for record-SMS',
    );
    expect(repository.records.get('record-PUSH')?.status).toBe('SENT');
    expect(repository.records.get('record-SIREN')?.status).toBe('SENT');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('SMS'),
      expect.any(String),
    );
  });

  it('rethrows every recording failure together as an AggregateError', async () => {
    repository.failingUpdates.add('record-PUSH');
    repository.failingUpdates.add('record-SMS');

    const error = await service.deliver(warning).catch((caught) => caught);

    expect(error).toBeInstanceOf(AggregateError);
    expect((error as AggregateError).errors).toHaveLength(2);
  });

  it('logs and rethrows a non-Error recording failure unchanged', async () => {
    vi.spyOn(repository, 'update').mockRejectedValueOnce('connection reset');

    await expect(service.deliver(warning)).rejects.toBe('connection reset');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('PUSH'),
      'connection reset',
    );
  });

  it('fails when a delivery record disappears before it can be updated', async () => {
    repository.vanishedRecords.add('record-PUSH');

    await expect(service.deliver(warning)).rejects.toThrow('record-PUSH');
  });

  it('saves QUEUED, then RETRYING with the error, then SENT for a channel that fails once', async () => {
    const updateSpy = vi.spyOn(repository, 'update');
    sms.send.mockResolvedValueOnce(failed('SMS gateway timeout'));

    await service.deliver(warning);

    const smsChanges = updateSpy.mock.calls
      .filter(([id]) => id === 'record-SMS')
      .map(([, changes]) => changes);
    expect(smsChanges).toEqual([
      { status: 'QUEUED', attempts: 1, lastAttemptAt: FIXED_NOW },
      { status: 'RETRYING', error: 'SMS gateway timeout' },
      { status: 'RETRYING', attempts: 2, lastAttemptAt: FIXED_NOW },
      { status: 'SENT', recipients: RECIPIENTS, error: NO_ERROR },
    ]);
  });

  it('creates the records for the warning version being delivered', async () => {
    const records = await service.deliver(
      buildWarningRecord({ version: 3, channels: ['SMS'] }),
    );

    expect(records).toEqual([
      expect.objectContaining({ warningVersion: 3, status: 'SENT' }),
    ]);
  });

  describe('retry (manual, after FAILED)', () => {
    const failedSms: DeliveryRecordEntry = {
      ...sentEntry('SMS', MAX_SEND_ATTEMPTS),
      status: 'FAILED',
      recipients: NO_RECIPIENTS,
      error: 'SMS gateway timeout',
    };

    beforeEach(() => {
      repository.seed(failedSms);
    });

    it('makes exactly one more attempt and records SENT', async () => {
      const record = await service.retry(failedSms.id);

      expect(sms.send).toHaveBeenCalledTimes(1);
      expect(sms.send).toHaveBeenCalledWith({
        warning,
        districts: KALU_DISTRICTS,
      });
      expect(record).toEqual({
        ...failedSms,
        status: 'SENT',
        attempts: MAX_SEND_ATTEMPTS + 1,
        recipients: RECIPIENTS,
        error: NO_ERROR,
      });
    });

    it('records FAILED again with the new error when the extra attempt fails', async () => {
      sms.send.mockResolvedValue(failed('still down'));

      const record = await service.retry(failedSms.id);

      expect(sms.send).toHaveBeenCalledTimes(1);
      expect(record).toMatchObject({
        status: 'FAILED',
        attempts: MAX_SEND_ATTEMPTS + 1,
        error: 'still down',
      });
    });

    it('throws DeliveryRecordNotFoundException for an unknown record', async () => {
      await expect(service.retry('missing-record')).rejects.toThrow(
        DeliveryRecordNotFoundException,
      );
    });

    it('refuses a record that is not FAILED', async () => {
      repository.seed(sentEntry('PUSH'));

      await expect(service.retry('record-PUSH')).rejects.toThrow(
        DeliveryNotRetryableException,
      );
      expect(push.send).not.toHaveBeenCalled();
    });

    it('refuses when the warning is no longer ACTIVE', async () => {
      warningsRepository.findById.mockResolvedValue(
        buildWarningRecord({ status: 'CANCELLED' }),
      );

      await expect(service.retry(failedSms.id)).rejects.toThrow(
        DeliveryNotRetryableException,
      );
      expect(sms.send).not.toHaveBeenCalled();
    });

    it('refuses a record from an older version of the warning', async () => {
      warningsRepository.findById.mockResolvedValue(
        buildWarningRecord({ version: 2 }),
      );

      await expect(service.retry(failedSms.id)).rejects.toThrow(
        /version 1.*version 2/,
      );
      expect(sms.send).not.toHaveBeenCalled();
    });

    it('throws WarningNotFoundException when the warning is missing', async () => {
      warningsRepository.findById.mockResolvedValue(null);

      await expect(service.retry(failedSms.id)).rejects.toThrow(
        WarningNotFoundException,
      );
    });
  });
});
