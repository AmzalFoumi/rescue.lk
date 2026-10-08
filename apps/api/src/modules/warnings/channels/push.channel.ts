import { Injectable } from '@nestjs/common';
import type { AlertChannelType } from '@rescue-lk/shared';
import { MockAlertChannel } from './mock-alert.channel.js';

const MOCK_APP_USERS_PER_DISTRICT = 40_000;

@Injectable()
export class PushChannel extends MockAlertChannel {
  readonly type: AlertChannelType = 'PUSH';
  protected readonly recipientsPerDistrict = MOCK_APP_USERS_PER_DISTRICT;
}
