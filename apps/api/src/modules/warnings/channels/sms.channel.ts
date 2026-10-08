import { Injectable } from '@nestjs/common';
import type { AlertChannelType } from '@rescue-lk/shared';
import { MockAlertChannel } from './mock-alert.channel.js';

const MOCK_PHONES_PER_DISTRICT = 120_000;

@Injectable()
export class SmsChannel extends MockAlertChannel {
  readonly type: AlertChannelType = 'SMS';
  protected readonly recipientsPerDistrict = MOCK_PHONES_PER_DISTRICT;
}
