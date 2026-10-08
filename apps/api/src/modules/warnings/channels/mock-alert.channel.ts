import { Logger } from '@nestjs/common';
import type { AlertChannelType } from '@rescue-lk/shared';
import type { WarningRecord } from '../warnings.repository.interface.js';
import type {
  AlertChannel,
  ChannelSendResult,
} from './alert-channel.interface.js';

// Shared behaviour for the mock gateways. A real gateway would implement
// AlertChannel directly; nothing outside the channels folder needs to change.
export abstract class MockAlertChannel implements AlertChannel {
  abstract readonly type: AlertChannelType;
  private readonly logger = new Logger(this.constructor.name);

  send(warning: WarningRecord): Promise<ChannelSendResult> {
    this.logger.log(
      `Mock ${this.type} gateway sent warning ${warning.id} "${warning.title}" to ${warning.districts.length} district(s)`,
    );
    return Promise.resolve({ success: true });
  }
}
