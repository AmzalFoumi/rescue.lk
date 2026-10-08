import { Inject, Injectable, Logger } from '@nestjs/common';
import type { AlertChannelType } from '@rescue-lk/shared';
import { CLOCK } from '../domain/clock.js';
import type { Clock } from '../domain/clock.js';
import { ChannelRegistry } from '../channels/channel.registry.js';
import type { AlertChannel } from '../channels/alert-channel.interface.js';
import { DELIVERY_RECORDS_REPOSITORY } from '../delivery-records.repository.interface.js';
import type {
  DeliveryRecordEntry,
  DeliveryRecordsRepository,
} from '../delivery-records.repository.interface.js';
import { WARNINGS_REPOSITORY } from '../warnings.repository.interface.js';
import type {
  WarningRecord,
  WarningsRepository,
} from '../warnings.repository.interface.js';
import { TARGET_AREA_CATALOG } from '../target-areas/target-area-catalog.interface.js';
import type { TargetAreaCatalog } from '../target-areas/target-area-catalog.interface.js';
import { DeliveryRecordNotFoundException } from '../exceptions/delivery-record-not-found.exception.js';
import { DeliveryNotRetryableException } from '../exceptions/delivery-not-retryable.exception.js';
import { WarningNotFoundException } from '../exceptions/warning-not-found.exception.js';
import { MANUAL_RETRY_ATTEMPTS } from '../warnings.constants.js';
import { RetryPolicy } from './retry.policy.js';
import { DeliveryAttemptRecorder } from './delivery-attempt.recorder.js';

// Parameter object for sending one warning on one channel.
interface ChannelRun {
  warning: WarningRecord;
  channel: AlertChannel;
  record: DeliveryRecordEntry;
  // Omitted for a normal delivery (MAX_SEND_ATTEMPTS applies).
  maxAttempts?: number;
}

interface RecordingFailure {
  channel: AlertChannelType;
  reason: unknown;
}

const isFulfilled = <T>(
  outcome: PromiseSettledResult<T>,
): outcome is PromiseFulfilledResult<T> => outcome.status === 'fulfilled';

// Sequence diagram step 10 deliver(): par fragment over the selected channels,
// each send wrapped in loop(0,3) [send failed], with every status change
// recorded (QUEUED -> RETRYING -> SENT | FAILED).
@Injectable()
export class WarningDeliveryService {
  private readonly logger = new Logger(WarningDeliveryService.name);

  constructor(
    @Inject(DELIVERY_RECORDS_REPOSITORY)
    private readonly deliveryRecords: DeliveryRecordsRepository,
    @Inject(WARNINGS_REPOSITORY)
    private readonly warnings: WarningsRepository,
    private readonly channelRegistry: ChannelRegistry,
    private readonly retryPolicy: RetryPolicy,
    @Inject(TARGET_AREA_CATALOG) private readonly areas: TargetAreaCatalog,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async deliver(warning: WarningRecord): Promise<DeliveryRecordEntry[]> {
    const channels = this.channelRegistry.resolve(warning.channels);
    const records = await Promise.all(
      channels.map((channel) =>
        this.deliveryRecords.create({
          warningId: warning.id,
          warningVersion: warning.version,
          channel: channel.type,
        }),
      ),
    );

    // allSettled: one channel failing never stops the others.
    const outcomes = await Promise.allSettled(
      channels.map((channel, index) =>
        this.runChannel({ warning, channel, record: records[index] }),
      ),
    );
    return this.collectRecords(warning.id, channels, outcomes);
  }

  // Manual retry from the delivery status screen: one extra attempt.
  async retry(recordId: string): Promise<DeliveryRecordEntry> {
    const record = await this.findRecordOrThrow(recordId);
    const warning = await this.findWarningOrThrow(record.warningId);
    this.assertRetryable(record, warning);

    const [channel] = this.channelRegistry.resolve([record.channel]);
    this.logger.log(
      `Manual retry of ${record.channel} delivery ${record.id} for warning ${warning.id} v${warning.version}`,
    );
    return this.runChannel({
      warning,
      channel,
      record,
      maxAttempts: MANUAL_RETRY_ATTEMPTS,
    });
  }

  private async runChannel({
    warning,
    channel,
    record,
    maxAttempts,
  }: ChannelRun): Promise<DeliveryRecordEntry> {
    const recorder = new DeliveryAttemptRecorder({
      record,
      repository: this.deliveryRecords,
      clock: this.clock,
    });
    const districts = this.areas.resolveDistricts(warning.areaIds);
    const context = `${channel.type} for warning ${warning.id} v${warning.version}`;

    const { result } = await this.retryPolicy.execute({
      operation: () => channel.send({ warning, districts }),
      context,
      listener: recorder,
      maxAttempts,
    });

    if (!result.success) {
      this.logger.error(
        `Could not send ${context} after ${recorder.current.attempts} attempt(s): ${result.error}`,
      );
      return recorder.current;
    }
    this.logger.log(
      `Sent ${context} to ${result.recipients} recipient(s) after ${recorder.current.attempts} attempt(s)`,
    );
    return recorder.recordSuccess(result.recipients);
  }

  private assertRetryable(
    record: DeliveryRecordEntry,
    warning: WarningRecord,
  ): void {
    const reason = this.notRetryableReason(record, warning);
    if (reason) {
      this.logger.warn(`Retry of delivery ${record.id} refused: ${reason}`);
      throw new DeliveryNotRetryableException({ recordId: record.id, reason });
    }
  }

  private notRetryableReason(
    record: DeliveryRecordEntry,
    warning: WarningRecord,
  ): string | null {
    if (record.status !== 'FAILED') {
      return `it is ${record.status}; only FAILED deliveries can be retried`;
    }
    if (warning.status !== 'ACTIVE') {
      return `warning ${warning.id} is ${warning.status}`;
    }
    if (record.warningVersion !== warning.version) {
      return `it belongs to version ${record.warningVersion}, but the warning is now version ${warning.version}`;
    }
    return null;
  }

  private async findRecordOrThrow(
    recordId: string,
  ): Promise<DeliveryRecordEntry> {
    const record = await this.deliveryRecords.findById(recordId);
    if (!record) {
      throw new DeliveryRecordNotFoundException(recordId);
    }
    return record;
  }

  private async findWarningOrThrow(warningId: string): Promise<WarningRecord> {
    const warning = await this.warnings.findById(warningId);
    if (!warning) {
      throw new WarningNotFoundException(warningId);
    }
    return warning;
  }

  // Returns every record, or logs and rethrows if any could not be recorded.
  private collectRecords(
    warningId: string,
    channels: readonly AlertChannel[],
    outcomes: readonly PromiseSettledResult<DeliveryRecordEntry>[],
  ): DeliveryRecordEntry[] {
    const failures: RecordingFailure[] = outcomes.flatMap((outcome, index) =>
      outcome.status === 'rejected'
        ? [{ channel: channels[index].type, reason: outcome.reason }]
        : [],
    );
    if (failures.length > 0) {
      throw this.recordingError(warningId, failures);
    }
    return outcomes.filter(isFulfilled).map((outcome) => outcome.value);
  }

  private recordingError(
    warningId: string,
    failures: readonly RecordingFailure[],
  ): unknown {
    for (const { channel, reason } of failures) {
      this.logger.error(
        `Recording ${channel} delivery for warning ${warningId} failed`,
        reason instanceof Error ? reason.stack : String(reason),
      );
    }
    const reasons = failures.map((failure) => failure.reason);
    return reasons.length === 1
      ? reasons[0]
      : new AggregateError(
          reasons,
          `Recording ${reasons.length} deliveries for warning ${warningId} failed`,
        );
  }
}
