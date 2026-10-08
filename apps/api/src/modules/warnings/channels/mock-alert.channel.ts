import { Logger } from '@nestjs/common';
import type { AlertChannelType } from '@rescue-lk/shared';
import type {
  AlertChannel,
  ChannelMessage,
  ChannelSendResult,
} from './alert-channel.interface.js';

// Shared behaviour for the mock gateways: always succeed and report an
// estimated reach. A real gateway would implement AlertChannel directly;
// nothing outside the channels folder needs to change.
export abstract class MockAlertChannel implements AlertChannel {
  abstract readonly type: AlertChannelType;
  // Mock reach per targeted district (phones, app users or siren towers).
  protected abstract readonly recipientsPerDistrict: number;
  private readonly logger = new Logger(this.constructor.name);

  send({ warning, districts }: ChannelMessage): Promise<ChannelSendResult> {
    const recipients = districts.length * this.recipientsPerDistrict;
    this.logger.log(
      `Mock ${this.type} gateway sent warning ${warning.id} v${warning.version} to ${recipients} recipient(s) in ${districts.length} district(s)`,
    );
    return Promise.resolve({ success: true, recipients });
  }
}
