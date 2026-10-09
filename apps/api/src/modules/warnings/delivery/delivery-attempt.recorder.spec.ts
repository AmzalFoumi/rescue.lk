import { describe, beforeEach, it, expect, vi, type Mocked } from 'vitest';
import { DeliveryAttemptRecorder } from './delivery-attempt.recorder.js';
import type {
  DeliveryRecordChanges,
  DeliveryRecordEntry,
  DeliveryRecordsRepository,
} from '../delivery-records.repository.interface.js';
import {
  FIXED_NOW,
  buildDeliveryRecord,
  fixedClock,
} from '../testing/warning.fixtures.js';

const queued = buildDeliveryRecord({
  status: 'QUEUED',
  attempts: 0,
  recipients: 0,
  lastAttemptAt: null,
  error: '',
});

describe('DeliveryAttemptRecorder (DeliveryRecord.recordDelivery per attempt)', () => {
  let repository: Mocked<DeliveryRecordsRepository>;

  beforeEach(() => {
    repository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByWarningVersion: vi.fn(),
      update: vi.fn((id: string, changes: DeliveryRecordChanges) =>
        Promise.resolve({ ...queued, id, ...changes } as DeliveryRecordEntry),
      ),
    };
  });

  const recorderFor = (record: DeliveryRecordEntry) =>
    new DeliveryAttemptRecorder({ record, repository, clock: fixedClock });

  it('marks the first ever attempt as QUEUED with its time', async () => {
    await recorderFor(queued).beforeAttempt(1);

    expect(repository.update).toHaveBeenCalledWith(queued.id, {
      status: 'QUEUED',
      attempts: 1,
      lastAttemptAt: FIXED_NOW,
    });
  });

  it('marks later attempts as RETRYING', async () => {
    await recorderFor(queued).beforeAttempt(2);

    expect(repository.update).toHaveBeenCalledWith(queued.id, {
      status: 'RETRYING',
      attempts: 2,
      lastAttemptAt: FIXED_NOW,
    });
  });

  it('continues the attempt count of a FAILED record on a manual retry', async () => {
    const failed = buildDeliveryRecord({ status: 'FAILED', attempts: 3 });

    await recorderFor(failed).beforeAttempt(1);

    expect(repository.update).toHaveBeenCalledWith(failed.id, {
      status: 'RETRYING',
      attempts: 4,
      lastAttemptAt: FIXED_NOW,
    });
  });

  it('keeps RETRYING with the error when another attempt will follow', async () => {
    await recorderFor(queued).afterFailedAttempt({
      attempt: 1,
      error: 'SMS gateway timeout',
      willRetry: true,
    });

    expect(repository.update).toHaveBeenCalledWith(queued.id, {
      status: 'RETRYING',
      error: 'SMS gateway timeout',
    });
  });

  it('marks FAILED with the error after the last attempt', async () => {
    await recorderFor(queued).afterFailedAttempt({
      attempt: 3,
      error: 'SMS gateway timeout',
      willRetry: false,
    });

    expect(repository.update).toHaveBeenCalledWith(queued.id, {
      status: 'FAILED',
      error: 'SMS gateway timeout',
    });
  });

  it('marks SENT with the recipients and clears the error, returning the stored record', async () => {
    const sent = await recorderFor(queued).recordSuccess(240000);

    expect(repository.update).toHaveBeenCalledWith(queued.id, {
      status: 'SENT',
      recipients: 240000,
      error: '',
    });
    expect(sent).toMatchObject({ status: 'SENT', recipients: 240000 });
  });

  it('exposes the latest stored state', async () => {
    const recorder = recorderFor(queued);
    expect(recorder.current).toEqual(queued);

    await recorder.afterFailedAttempt({
      attempt: 1,
      error: 'down',
      willRetry: false,
    });

    expect(recorder.current).toMatchObject({ status: 'FAILED', error: 'down' });
  });

  it('throws when the record no longer exists', async () => {
    repository.update.mockResolvedValue(null);

    await expect(recorderFor(queued).beforeAttempt(1)).rejects.toThrow(
      queued.id,
    );
  });
});
