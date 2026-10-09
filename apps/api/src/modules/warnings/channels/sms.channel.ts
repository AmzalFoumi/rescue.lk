import { Injectable } from '@nestjs/common';
import type { AlertChannelType } from '@rescue-lk/shared';
import { MockAlertChannel } from './mock-alert.channel.js';

const MOCK_PHONES_PER_DISTRICT = 120_000;

// SmsChannel sends a warning as an SMS to phones in the target districts (mock gateway
// for now).
// Strategy: one interchangeable AlertChannel. Only its type and its reach per district
// differ from the other channels; the shared behaviour comes from MockAlertChannel.
@Injectable()
export class SmsChannel extends MockAlertChannel {
  readonly type: AlertChannelType = 'SMS';
  protected readonly recipientsPerDistrict = MOCK_PHONES_PER_DISTRICT;
}
