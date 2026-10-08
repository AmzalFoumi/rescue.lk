import { Injectable } from '@nestjs/common';
import type { AlertChannelType } from '@rescue-lk/shared';
import { MockAlertChannel } from './mock-alert.channel.js';

const MOCK_SIREN_TOWERS_PER_DISTRICT = 8;

// Public siren system (named "audible" before the UC1 design was agreed).
@Injectable()
export class SirenChannel extends MockAlertChannel {
  readonly type: AlertChannelType = 'SIREN';
  protected readonly recipientsPerDistrict = MOCK_SIREN_TOWERS_PER_DISTRICT;
}
