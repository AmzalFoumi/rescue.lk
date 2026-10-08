import { Inject, Injectable, Logger } from '@nestjs/common';
import type { AlertChannelType } from '@rescue-lk/shared';
import { CLOCK } from '../domain/clock.js';
import type { Clock } from '../domain/clock.js';
import { ChannelRegistry } from '../channels/channel.registry.js';
import type { AlertChannel } from '../channels/alert-channel.interface.js';
import { DELIVERY_RECORDS_REPOSITORY } from '../delivery-records.repository.interface.js';
import type {
  DeliveryRecordChanges,
  DeliveryRecordEntry,
  DeliveryRecordsRepository,
} from '../delivery-records.repository.interface.js';
import type { WarningRecord } from '../warnings.repository.interface.js';
import { RetryPolicy } from './retry.policy.js';
import type { RetryOutcome } from './retry.policy.js';

// Parameter object for delivering one warning on one channel.
interface ChannelDelivery {
  warning: WarningRecord;
  channel: AlertChannel;
  record: DeliveryRecordEntry;
}

interface RecordingFailure {
  channel: AlertChannelType;
  reason: unknown;
}

const isFulfilled = <T>(
  outcome: PromiseSettledResult<T>,
): outcome is PromiseFulfilledResult<T> => outcome.status === 'fulfilled';

// Sequence diagram step 10 deliver(): par fragment over the selected channels,
// each send wrapped in loop(0,3) [send failed], then recordDelivery per channel.
@Injectable()
export class WarningDeliveryService {
  private readonly logger = new Logger(WarningDeliveryService.name);

  constructor(
    @Inject(DELIVERY_RECORDS_REPOSITORY)
    private readonly deliveryRecords: DeliveryRecordsRepository,
    private readonly channelRegistry: ChannelRegistry,
    private readonly retryPolicy: RetryPolicy,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async deliver(warning: WarningRecord): Promise<DeliveryRecordEntry[]> {
    const channels = this.channelRegistry.resolve(warning.channels);
    const records = await Promise.all(
      channels.map((channel) =>
        this.deliveryRecords.create({
          warningId: warning.id,
          channel: channel.type,
        }),
      ),
    );

    // allSettled: one channel failing never stops the others.
    const outcomes = await Promise.allSettled(
      channels.map((channel, index) =>
        this.deliverOnChannel({ warning, channel, record: records[index] }),
      ),
    );
    return this.collectRecords(warning.id, channels, outcomes);
  }

  private async deliverOnChannel(
    delivery: ChannelDelivery,
  ): Promise<DeliveryRecordEntry> {
    const { warning, channel, record } = delivery;
    const outcome = await this.retryPolicy.execute(
      () => channel.send(warning),
      `${channel.type} for warning ${warning.id}`,
    );
    this.logOutcome(delivery, outcome);
    const { result, attempts } = outcome;
    return this.recordDelivery(record.id, {
      status: result.success ? 'sent' : 'failed',
      attempts,
      lastAttemptAt: this.clock.now(),
      ...(result.success ? {} : { failureReason: result.failureReason }),
    });
  }

  // Sequence diagram: DeliveryRecord.recordDelivery().
  private async recordDelivery(
    recordId: string,
    changes: DeliveryRecordChanges,
  ): Promise<DeliveryRecordEntry> {
    const updated = await this.deliveryRecords.update(recordId, changes);
    if (!updated) {
      throw new Error(
        `Delivery record ${recordId} no longer exists and could not be updated`,
      );
    }
    return updated;
  }

  private logOutcome(
    { warning, channel }: ChannelDelivery,
    { result, attempts }: RetryOutcome,
  ): void {
    if (result.success) {
      this.logger.log(
        `Warning ${warning.id} sent via ${channel.type} after ${attempts} attempt(s)`,
      );
      return;
    }
    this.logger.error(
      `Warning ${warning.id} could not be sent via ${channel.type} after ${attempts} attempt(s): ${result.failureReason}`,
    );
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
