import { Injectable } from '@nestjs/common';
import type { AlertChannelType } from '@rescue-lk/shared';
import { MockAlertChannel } from './mock-alert.channel.js';

const MOCK_APP_USERS_PER_DISTRICT = 40_000;

// PushChannel sends a warning as an app push notification (mock gateway for now).
// Strategy: one interchangeable AlertChannel. Only its type and its reach per district
// differ from the other channels; the shared behaviour comes from MockAlertChannel.
@Injectable()
export class PushChannel extends MockAlertChannel {
  readonly type: AlertChannelType = 'PUSH';
  protected readonly recipientsPerDistrict = MOCK_APP_USERS_PER_DISTRICT;
}
