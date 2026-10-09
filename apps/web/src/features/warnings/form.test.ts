import { describe, it, expect } from 'vitest';
import type { VerifiedHazardReportDto, WarningDto } from '@rescue-lk/shared';
import {
  EMPTY_FORM,
  blankForm,
  formFromWarning,
  toSubmitRequest,
  toUpdateRequest,
} from './form';

const report = {
  id: 'r1',
  hazardType: 'landslide',
} as VerifiedHazardReportDto;

describe('warning form model', () => {
  it('starts a new warning with SMS and push selected', () => {
    expect(blankForm()).toEqual({ ...EMPTY_FORM, channels: ['SMS', 'PUSH'] });
  });

  it('pre-fills a new warning from its report', () => {
    expect(blankForm(report, 'D-BADULLA')).toMatchObject({
      sourceReportId: 'r1',
      hazard: 'landslide',
      areaIds: ['D-BADULLA'],
    });
  });

  it('loads a saved warning into the form', () => {
    const warning = {
      sourceReportId: 'r1',
      hazard: 'flood',
      otherHazard: '',
      severity: 'HIGH',
      areaIds: ['B-KALU'],
      message: 'm',
      instructions: 'i',
      channels: ['SMS'],
    } as WarningDto;

    expect(formFromWarning(warning)).toEqual({
      sourceReportId: 'r1',
      hazard: 'flood',
      otherHazard: '',
      severity: 'HIGH',
      areaIds: ['B-KALU'],
      message: 'm',
      instructions: 'i',
      channels: ['SMS'],
    });
  });

  it('builds the submit and update requests', () => {
    const values = blankForm(report, 'D-BADULLA');

    expect(
      toSubmitRequest(values, { createdBy: 'Officer', draftId: 'd1' }),
    ).toMatchObject({
      sourceReportId: 'r1',
      createdBy: 'Officer',
      draftId: 'd1',
    });
    expect(
      toSubmitRequest(values, { createdBy: 'Officer' }),
    ).not.toHaveProperty('draftId');
    expect(toUpdateRequest(values)).not.toHaveProperty('sourceReportId');
  });
});

describe('levelStepErrors (before "Continue to affected area")', () => {
  it('asks for the report, hazard and severity when missing', async () => {
    const { levelStepErrors } = await import('./form');

    expect(levelStepErrors(EMPTY_FORM)).toEqual({
      sourceReportId: 'Select the verified report this warning is based on.',
      hazard: 'Choose a hazard type.',
      severity: 'Choose a warning level.',
    });
  });

  it('asks for a name when the hazard is other', async () => {
    const { levelStepErrors } = await import('./form');
    const values = {
      ...EMPTY_FORM,
      sourceReportId: 'r1',
      hazard: 'other' as const,
      otherHazard: '  ',
      severity: 'HIGH' as const,
    };

    expect(levelStepErrors(values)).toEqual({
      otherHazard: 'Name the hazard.',
    });
  });

  it('passes a complete level step', async () => {
    const { levelStepErrors } = await import('./form');

    expect(
      levelStepErrors({
        ...EMPTY_FORM,
        sourceReportId: 'r1',
        hazard: 'flood',
        severity: 'HIGH',
      }),
    ).toEqual({});
  });
});

describe('applySourceReport', () => {
  it('takes the hazard of the chosen report and its district as the area', async () => {
    const { applySourceReport } = await import('./form');

    expect(applySourceReport(EMPTY_FORM, report, 'D-BADULLA')).toMatchObject({
      sourceReportId: 'r1',
      hazard: 'landslide',
      areaIds: ['D-BADULLA'],
    });
  });

  it('keeps areas already chosen', async () => {
    const { applySourceReport } = await import('./form');

    expect(
      applySourceReport(
        { ...EMPTY_FORM, areaIds: ['B-KALU'] },
        report,
        'D-BADULLA',
      ).areaIds,
    ).toEqual(['B-KALU']);
  });

  it('clears the report when none is chosen, keeping the rest', async () => {
    const { applySourceReport } = await import('./form');

    expect(
      applySourceReport({
        ...EMPTY_FORM,
        sourceReportId: 'r1',
        hazard: 'fire',
      }),
    ).toMatchObject({ sourceReportId: '', hazard: 'fire' });
  });
});
