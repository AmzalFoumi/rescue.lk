import { describe, it, expect } from 'vitest';
import {
  toDeliveryRecordDto,
  toWarningDeliveryResultDto,
  toWarningDto,
} from './warnings.mapper.js';
import type { DeliveryRecordEntry } from './delivery-records.repository.interface.js';
import {
  FIXED_NOW,
  WARNING_ID,
  buildWarningRecord,
} from './testing/warning.fixtures.js';

const sentRecord: DeliveryRecordEntry = {
  id: '665f1b2c9d3e4a0012345671',
  warningId: WARNING_ID,
  channel: 'push',
  status: 'sent',
  attempts: 1,
  lastAttemptAt: new Date(FIXED_NOW),
};

describe('warnings mapper', () => {
  it('maps a warning record to a WarningDto with ISO dates', () => {
    const warning = buildWarningRecord();

    expect(toWarningDto(warning)).toEqual({
      id: warning.id,
      hazardReportId: warning.hazardReportId,
      title: warning.title,
      message: warning.message,
      severity: warning.severity,
      districts: warning.districts,
      channels: warning.channels,
      status: warning.status,
      issuedAt: warning.issuedAt.toISOString(),
      expiresAt: warning.expiresAt.toISOString(),
    });
  });

  it('maps a delivery record with its last attempt time as an ISO string', () => {
    expect(toDeliveryRecordDto(sentRecord)).toEqual({
      id: sentRecord.id,
      warningId: WARNING_ID,
      channel: 'push',
      status: 'sent',
      attempts: 1,
      lastAttemptAt: FIXED_NOW.toISOString(),
    });
  });

  it('keeps the failure reason of a failed delivery', () => {
    const failed: DeliveryRecordEntry = {
      ...sentRecord,
      status: 'failed',
      attempts: 3,
      failureReason: 'gateway unavailable',
    };

    expect(toDeliveryRecordDto(failed)).toMatchObject({
      status: 'failed',
      failureReason: 'gateway unavailable',
    });
  });

  it('omits optional fields a pending delivery does not have yet', () => {
    const pending: DeliveryRecordEntry = {
      id: sentRecord.id,
      warningId: WARNING_ID,
      channel: 'sms',
      status: 'pending',
      attempts: 0,
    };

    const dto = toDeliveryRecordDto(pending);

    expect(dto).not.toHaveProperty('failureReason');
    expect(dto).not.toHaveProperty('lastAttemptAt');
  });

  it('combines a warning and its deliveries into one result', () => {
    const warning = buildWarningRecord();

    expect(toWarningDeliveryResultDto(warning, [sentRecord])).toEqual({
      warning: toWarningDto(warning),
      deliveries: [toDeliveryRecordDto(sentRecord)],
    });
  });
});
