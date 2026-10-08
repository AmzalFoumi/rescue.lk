import { Injectable } from '@nestjs/common';
import type { AlertChannelType } from '@rescue-lk/shared';
import { MockAlertChannel } from './mock-alert.channel.js';

const MOCK_SIREN_TOWERS_PER_DISTRICT = 8;

// SirenChannel sounds the public sirens (mock gateway; it was called "audible" before
// the UC1 design was agreed).
// Strategy: one interchangeable AlertChannel; the shared behaviour comes from
// MockAlertChannel. Its reach is counted in siren towers, not people, so the web app
// leaves it out of people counts.
@Injectable()
export class SirenChannel extends MockAlertChannel {
  readonly type: AlertChannelType = 'SIREN';
  protected readonly recipientsPerDistrict = MOCK_SIREN_TOWERS_PER_DISTRICT;
}
