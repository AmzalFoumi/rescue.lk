import { Logger } from '@nestjs/common';
import type { AlertChannelType } from '@rescue-lk/shared';
import type {
  AlertChannel,
  ChannelMessage,
  ChannelSendResult,
} from './alert-channel.interface.js';

// MockAlertChannel is the shared base of the mock gateways: they always succeed and
// report an estimated reach per district.
// DRY: the send and reach logic is written once; each subclass only sets its type and
// its reach per district.
// LSP: every subclass can stand in for AlertChannel without surprises.
// A real gateway (e.g. an SMS provider) would implement AlertChannel directly, and
// nothing outside the channels folder would need to change.
export abstract class MockAlertChannel implements AlertChannel {
  abstract readonly type: AlertChannelType;
  // Mock reach per targeted district (phones, app users or siren towers).
  protected abstract readonly recipientsPerDistrict: number;
  private readonly logger = new Logger(this.constructor.name);

  estimateRecipients(districts: readonly string[]): number {
    return districts.length * this.recipientsPerDistrict;
  }

  send({ warning, districts }: ChannelMessage): Promise<ChannelSendResult> {
    const recipients = this.estimateRecipients(districts);
    this.logger.log(
      `Mock ${this.type} gateway sent warning ${warning.id} v${warning.version} to ${recipients} recipient(s) in ${districts.length} district(s)`,
    );
    return Promise.resolve({ success: true, recipients });
  }
}
