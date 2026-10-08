import { HttpException, HttpStatus } from '@nestjs/common';
import { describe, it, expect } from 'vitest';
import { HazardReportNotFoundException } from './hazard-report-not-found.exception.js';
import { ReportNotVerifiedException } from './report-not-verified.exception.js';
import { InvalidWarningException } from './invalid-warning.exception.js';
import { UnsupportedChannelException } from './unsupported-channel.exception.js';

const REPORT_ID = '665f1b2c9d3e4a0012345678';

describe('warning domain exceptions', () => {
  it('HazardReportNotFoundException is a 404 naming the report', () => {
    const exception = new HazardReportNotFoundException(REPORT_ID);

    expect(exception).toBeInstanceOf(HttpException);
    expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
    expect(exception.message).toContain(REPORT_ID);
  });

  it('ReportNotVerifiedException is a 422 naming the report and its status', () => {
    const exception = new ReportNotVerifiedException(REPORT_ID, 'pending');

    expect(exception).toBeInstanceOf(HttpException);
    expect(exception.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(exception.message).toContain(REPORT_ID);
    expect(exception.message).toContain('pending');
  });

  it('InvalidWarningException is a 400 that carries every reason', () => {
    const reasons = ['first problem', 'second problem'];
    const exception = new InvalidWarningException(reasons);

    expect(exception).toBeInstanceOf(HttpException);
    expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    expect(exception.reasons).toEqual(reasons);
    expect(exception.getResponse()).toMatchObject({ reasons });
  });

  it('UnsupportedChannelException is a 400 naming the unsupported channels', () => {
    const exception = new UnsupportedChannelException(['fax', 'pager']);

    expect(exception).toBeInstanceOf(HttpException);
    expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    expect(exception.message).toContain('fax');
    expect(exception.message).toContain('pager');
  });
});
