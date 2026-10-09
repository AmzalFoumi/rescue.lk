import { HttpException, HttpStatus } from '@nestjs/common';
import { describe, it, expect } from 'vitest';
import { HazardReportNotFoundException } from './hazard-report-not-found.exception.js';
import { ReportNotVerifiedException } from './report-not-verified.exception.js';
import { InvalidWarningException } from './invalid-warning.exception.js';
import { UnsupportedChannelException } from './unsupported-channel.exception.js';
import { WarningNotFoundException } from './warning-not-found.exception.js';
import { WarningStatusConflictException } from './warning-status-conflict.exception.js';
import { DeliveryRecordNotFoundException } from './delivery-record-not-found.exception.js';
import { DeliveryNotRetryableException } from './delivery-not-retryable.exception.js';

const REPORT_ID = '665f1b2c9d3e4a0012345678';
const WARNING_ID = '665f1b2c9d3e4a0012345670';
const RECORD_ID = '665f1b2c9d3e4a0012345671';

describe('warning domain exceptions', () => {
  it('WarningNotFoundException is a 404 naming the warning', () => {
    const exception = new WarningNotFoundException(WARNING_ID);

    expect(exception).toBeInstanceOf(HttpException);
    expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
    expect(exception.message).toContain(WARNING_ID);
  });

  it('HazardReportNotFoundException is a 404 naming the report', () => {
    const exception = new HazardReportNotFoundException(REPORT_ID);

    expect(exception).toBeInstanceOf(HttpException);
    expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
    expect(exception.message).toContain(REPORT_ID);
  });

  it('ReportNotVerifiedException is a 422 naming the report and its status', () => {
    const exception = new ReportNotVerifiedException(
      REPORT_ID,
      'pending_verification',
    );

    expect(exception).toBeInstanceOf(HttpException);
    expect(exception.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(exception.message).toContain(REPORT_ID);
    expect(exception.message).toContain('pending');
  });

  it('InvalidWarningException is a 400 that carries one error per field', () => {
    const errors = { message: 'Too short.', areaIds: 'Add an area.' };
    const exception = new InvalidWarningException(errors);

    expect(exception).toBeInstanceOf(HttpException);
    expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    expect(exception.errors).toEqual(errors);
    expect(exception.getResponse()).toMatchObject({ errors });
  });

  it('UnsupportedChannelException is a 400 naming the unsupported channels', () => {
    const exception = new UnsupportedChannelException(['fax', 'pager']);

    expect(exception).toBeInstanceOf(HttpException);
    expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    expect(exception.message).toContain('fax');
    expect(exception.message).toContain('pager');
  });

  it('WarningStatusConflictException is a 409 naming the action and both statuses', () => {
    const exception = new WarningStatusConflictException({
      warningId: WARNING_ID,
      action: 'cancel',
      currentStatus: 'DRAFT',
      requiredStatus: 'ACTIVE',
    });

    expect(exception).toBeInstanceOf(HttpException);
    expect(exception.getStatus()).toBe(HttpStatus.CONFLICT);
    expect(exception.message).toContain(WARNING_ID);
    expect(exception.message).toMatch(/cancel.*DRAFT.*ACTIVE/);
  });

  it('DeliveryRecordNotFoundException is a 404 naming the record', () => {
    const exception = new DeliveryRecordNotFoundException(RECORD_ID);

    expect(exception).toBeInstanceOf(HttpException);
    expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
    expect(exception.message).toContain(RECORD_ID);
  });

  it('DeliveryNotRetryableException is a 409 naming the record and the reason', () => {
    const exception = new DeliveryNotRetryableException({
      recordId: RECORD_ID,
      reason: 'it is SENT',
    });

    expect(exception).toBeInstanceOf(HttpException);
    expect(exception.getStatus()).toBe(HttpStatus.CONFLICT);
    expect(exception.message).toContain(RECORD_ID);
    expect(exception.message).toContain('it is SENT');
  });
});
