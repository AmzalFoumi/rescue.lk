import { describe, it, expect } from 'vitest';
import type { WarningFormRequestDto } from '@rescue-lk/shared';
import {
  toDeliveryRecordDto,
  toWarningDeliveryResultDto,
  toWarningDto,
  toWarningForm,
} from './warnings.mapper.js';
import {
  EARLIER,
  FIXED_NOW,
  buildDeliveryRecord,
  buildWarningRecord,
} from './testing/warning.fixtures.js';

const request: WarningFormRequestDto = {
  sourceReportId: '665f1b2c9d3e4a00000000a1',
  hazard: 'FLOOD',
  severity: 'HIGH',
  areaIds: ['B-KALU'],
  message: '  The Kalu Ganga is rising quickly.  ',
};

describe('warnings mapper', () => {
  describe('toWarningForm (request -> domain)', () => {
    it('trims text and defaults the optional fields', () => {
      expect(toWarningForm(request)).toEqual({
        sourceReportId: request.sourceReportId,
        hazard: 'FLOOD',
        otherHazard: '',
        severity: 'HIGH',
        areaIds: ['B-KALU'],
        message: 'The Kalu Ganga is rising quickly.',
        instructions: '',
        channels: [],
      });
    });

    it('keeps the trimmed hazard name only when the hazard is OTHER', () => {
      expect(
        toWarningForm({
          ...request,
          hazard: 'OTHER',
          otherHazard: ' Dam breach ',
        }).otherHazard,
      ).toBe('Dam breach');
      expect(
        toWarningForm({ ...request, otherHazard: 'ignored' }).otherHazard,
      ).toBe('');
    });

    it('uses an empty hazard name when OTHER is chosen without one', () => {
      expect(toWarningForm({ ...request, hazard: 'OTHER' }).otherHazard).toBe(
        '',
      );
    });

    it('keeps instructions and channels when given', () => {
      expect(
        toWarningForm({
          ...request,
          instructions: ' Move to higher ground. ',
          channels: ['SMS'],
        }),
      ).toMatchObject({
        instructions: 'Move to higher ground.',
        channels: ['SMS'],
      });
    });
  });

  it('maps a warning record to a WarningDto with ISO dates and nulls', () => {
    const warning = buildWarningRecord();

    expect(toWarningDto(warning)).toEqual({
      ...warning,
      createdAt: EARLIER.toISOString(),
      publishedAt: EARLIER.toISOString(),
      updatedAt: null,
      cancelledAt: null,
    });
  });

  it('maps every optional warning date when it is set', () => {
    const dto = toWarningDto(
      buildWarningRecord({
        updatedAt: new Date(FIXED_NOW),
        cancelledAt: new Date(FIXED_NOW),
      }),
    );

    expect(dto.updatedAt).toBe(FIXED_NOW.toISOString());
    expect(dto.cancelledAt).toBe(FIXED_NOW.toISOString());
  });

  it('maps a delivery record with its last attempt as an ISO string', () => {
    const record = buildDeliveryRecord();

    expect(toDeliveryRecordDto(record)).toEqual({
      ...record,
      lastAttemptAt: FIXED_NOW.toISOString(),
    });
  });

  it('keeps lastAttemptAt null for a delivery not attempted yet', () => {
    expect(
      toDeliveryRecordDto(
        buildDeliveryRecord({
          status: 'QUEUED',
          attempts: 0,
          lastAttemptAt: null,
        }),
      ).lastAttemptAt,
    ).toBeNull();
  });

  it('combines a warning and its deliveries into one result', () => {
    const warning = buildWarningRecord();
    const record = buildDeliveryRecord();

    expect(toWarningDeliveryResultDto(warning, [record])).toEqual({
      warning: toWarningDto(warning),
      deliveries: [toDeliveryRecordDto(record)],
    });
  });
});
