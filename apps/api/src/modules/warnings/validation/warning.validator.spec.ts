import { Logger } from '@nestjs/common';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import { WarningValidator } from './warning.validator.js';
import type { IssueWarningCommand } from '../domain/issue-warning.command.js';
import type { HazardReportSummary } from '../hazard-report-lookup/hazard-report-lookup.interface.js';
import { InvalidWarningException } from '../exceptions/invalid-warning.exception.js';
import { ReportNotVerifiedException } from '../exceptions/report-not-verified.exception.js';
import {
  MAX_WARNING_DURATION_HOURS,
  MILLISECONDS_PER_HOUR,
} from '../warnings.constants.js';

const NOW = new Date('2026-10-08T12:00:00.000Z');
const ONE_MILLISECOND = 1;
const REPORT_DISTRICT = '665f1b2c9d3e4a00000000d1';
const OTHER_DISTRICT = '665f1b2c9d3e4a00000000d2';

const hoursFromNow = (hours: number): Date =>
  new Date(NOW.getTime() + hours * MILLISECONDS_PER_HOUR);

const verifiedReport: HazardReportSummary = {
  id: '665f1b2c9d3e4a00000000a1',
  hazardType: 'flood',
  district: REPORT_DISTRICT,
  status: 'verified',
  description: 'Kelani River overflowing',
};

const buildCommand = (
  overrides: Partial<IssueWarningCommand> = {},
): IssueWarningCommand => ({
  hazardReportId: verifiedReport.id,
  title: 'Flood warning',
  message: 'Move to higher ground immediately.',
  severity: 'severe',
  districts: [REPORT_DISTRICT],
  channels: ['push', 'sms'],
  expiresAt: hoursFromNow(1),
  ...overrides,
});

const captureInvalidWarning = (action: () => void): InvalidWarningException => {
  try {
    action();
  } catch (error) {
    if (error instanceof InvalidWarningException) {
      return error;
    }
    throw error;
  }
  throw new Error('Expected InvalidWarningException to be thrown');
};

describe('WarningValidator (step 8.2 validateWarning)', () => {
  let validator: WarningValidator;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    validator = new WarningValidator();
    warnSpy = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('accepts a valid warning for a verified report', () => {
    expect(() =>
      validator.validate({
        command: buildCommand(),
        report: verifiedReport,
        now: NOW,
      }),
    ).not.toThrow();
  });

  it.each(['pending', 'rejected'] as const)(
    'rejects a %s report with ReportNotVerifiedException',
    (status) => {
      expect(() =>
        validator.validate({
          command: buildCommand(),
          report: { ...verifiedReport, status },
          now: NOW,
        }),
      ).toThrow(ReportNotVerifiedException);
    },
  );

  it('checks verification before any other rule', () => {
    expect(() =>
      validator.validate({
        command: buildCommand({ expiresAt: hoursFromNow(-1) }),
        report: { ...verifiedReport, status: 'pending' },
        now: NOW,
      }),
    ).toThrow(ReportNotVerifiedException);
  });

  it.each([
    ['in the past', hoursFromNow(-1)],
    ['exactly now', NOW],
  ])('rejects an expiry %s', (_label, expiresAt) => {
    const exception = captureInvalidWarning(() =>
      validator.validate({
        command: buildCommand({ expiresAt }),
        report: verifiedReport,
        now: NOW,
      }),
    );

    expect(exception.reasons).toEqual([
      expect.stringContaining('in the future'),
    ]);
  });

  it('accepts an expiry exactly at the maximum duration', () => {
    expect(() =>
      validator.validate({
        command: buildCommand({
          expiresAt: hoursFromNow(MAX_WARNING_DURATION_HOURS),
        }),
        report: verifiedReport,
        now: NOW,
      }),
    ).not.toThrow();
  });

  it('rejects an expiry beyond the maximum duration', () => {
    const tooLate = new Date(
      hoursFromNow(MAX_WARNING_DURATION_HOURS).getTime() + ONE_MILLISECOND,
    );

    const exception = captureInvalidWarning(() =>
      validator.validate({
        command: buildCommand({ expiresAt: tooLate }),
        report: verifiedReport,
        now: NOW,
      }),
    );

    expect(exception.reasons).toEqual([
      expect.stringContaining(`${MAX_WARNING_DURATION_HOURS} hours`),
    ]);
  });

  it('rejects target districts that leave out the report district', () => {
    const exception = captureInvalidWarning(() =>
      validator.validate({
        command: buildCommand({ districts: [OTHER_DISTRICT] }),
        report: verifiedReport,
        now: NOW,
      }),
    );

    expect(exception.reasons).toEqual([
      expect.stringContaining(REPORT_DISTRICT),
    ]);
  });

  it('accepts extra target districts alongside the report district', () => {
    expect(() =>
      validator.validate({
        command: buildCommand({
          districts: [REPORT_DISTRICT, OTHER_DISTRICT],
        }),
        report: verifiedReport,
        now: NOW,
      }),
    ).not.toThrow();
  });

  it('collects every violation into one InvalidWarningException', () => {
    const exception = captureInvalidWarning(() =>
      validator.validate({
        command: buildCommand({
          expiresAt: hoursFromNow(-1),
          districts: [OTHER_DISTRICT],
        }),
        report: verifiedReport,
        now: NOW,
      }),
    );

    expect(exception.reasons).toHaveLength(2);
  });

  it('logs a rejected warning at warn level with the report id', () => {
    captureInvalidWarning(() =>
      validator.validate({
        command: buildCommand({ expiresAt: hoursFromNow(-1) }),
        report: verifiedReport,
        now: NOW,
      }),
    );

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(verifiedReport.id),
    );
  });
});
