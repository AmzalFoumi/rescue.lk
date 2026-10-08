import type { Clock } from '../domain/clock.js';
import type {
  DeliveryRecordChanges,
  DeliveryRecordEntry,
  DeliveryRecordsRepository,
} from '../delivery-records.repository.interface.js';
import { NO_ERROR } from '../warnings.constants.js';
import type { FailedAttempt, RetryListener } from './retry.policy.js';

const FIRST_EVER_ATTEMPT = 1;

export interface DeliveryAttemptRecorderDeps {
  record: DeliveryRecordEntry;
  repository: DeliveryRecordsRepository;
  clock: Clock;
}

// DeliveryAttemptRecorder saves every status change of one delivery record as
// RetryPolicy reports it: QUEUED -> RETRYING -> SENT or FAILED.
// Observer: it implements RetryListener, so RetryPolicy does not know the database
// exists and the recorder does not know how retries work.
// SRP: it only records. Sequence diagram: DeliveryRecord.recordDelivery().
// Attempt numbers continue from the stored count, so a manual retry after 3 failed
// attempts is saved as attempt 4 and the history stays honest.
export class DeliveryAttemptRecorder implements RetryListener {
  private latest: DeliveryRecordEntry;
  private readonly baseAttempts: number;
  private readonly repository: DeliveryRecordsRepository;
  private readonly clock: Clock;

  constructor({ record, repository, clock }: DeliveryAttemptRecorderDeps) {
    this.latest = record;
    this.baseAttempts = record.attempts;
    this.repository = repository;
    this.clock = clock;
  }

  get current(): DeliveryRecordEntry {
    return this.latest;
  }

  async beforeAttempt(attempt: number): Promise<void> {
    const attempts = this.baseAttempts + attempt;
    await this.save({
      status: attempts === FIRST_EVER_ATTEMPT ? 'QUEUED' : 'RETRYING',
      attempts,
      lastAttemptAt: this.clock.now(),
    });
  }

  async afterFailedAttempt({ error, willRetry }: FailedAttempt): Promise<void> {
    await this.save({ status: willRetry ? 'RETRYING' : 'FAILED', error });
  }

  recordSuccess(recipients: number): Promise<DeliveryRecordEntry> {
    return this.save({ status: 'SENT', recipients, error: NO_ERROR });
  }

  private async save(
    changes: DeliveryRecordChanges,
  ): Promise<DeliveryRecordEntry> {
    const updated = await this.repository.update(this.latest.id, changes);
    if (!updated) {
      throw new Error(
        `Delivery record ${this.latest.id} no longer exists and could not be updated`,
      );
    }
    this.latest = updated;
    return updated;
  }
}
