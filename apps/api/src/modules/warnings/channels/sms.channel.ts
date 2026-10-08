import { Injectable } from '@nestjs/common';
import type { AlertChannelType } from '@rescue-lk/shared';
import { MockAlertChannel } from './mock-alert.channel.js';

@Injectable()
export class SmsChannel extends MockAlertChannel {
  readonly type: AlertChannelType = 'sms';
}
