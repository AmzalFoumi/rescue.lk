import { describe, expect, it } from 'vitest';
import type { DistrictDto } from '@rescue-lk/shared';
import { buildReviewRows } from './review-rows';
import { EMPTY_DRAFT, type ReportDraft } from './report-draft';

const districts: DistrictDto[] = [
  {
    id: 'd-gal',
    name: 'Galle',
    province: 'Southern',
    latitude: 6.05,
    longitude: 80.22,
  },
];
const capturedAt = new Date('2026-10-07T10:43:00Z');

const gpsDraft: ReportDraft = {
  ...EMPTY_DRAFT,
  hazardType: 'landslide',
  description: '  Soil is sliding onto the road  ',
  location: { source: 'gps', fix: { latitude: 6.6828, longitude: 80.3992 } },
};

function row(rows: ReturnType<typeof buildReviewRows>, label: string) {
  const found = rows.find((candidate) => candidate.label === label);
  if (!found) throw new Error(`No row ${label}`);
  return found;
}

describe('buildReviewRows', () => {
  it('describes a GPS report', () => {
    const rows = buildReviewRows(gpsDraft, districts, capturedAt);
    expect(row(rows, 'Hazard type')).toMatchObject({
      value: 'Landslide',
      editStep: 1,
    });
    expect(row(rows, 'Location')).toMatchObject({
      value: '6.6828° N, 80.3992° E (GPS)',
      editStep: 2,
    });
    expect(row(rows, 'Description')).toMatchObject({
      value: 'Soil is sliding onto the road',
      editStep: 2,
    });
    expect(row(rows, 'Photo')).toMatchObject({
      value: 'No photo',
      editStep: 3,
    });
  });

  it('describes a manual location with the landmark and the district', () => {
    const draft: ReportDraft = {
      ...gpsDraft,
      location: {
        source: 'manual',
        districtId: 'd-gal',
        landmark: ' Fort bus stand ',
      },
    };
    expect(
      row(buildReviewRows(draft, districts, capturedAt), 'Location').value,
    ).toBe('Fort bus stand, Galle (entered manually)');
  });

  it('copes with a district that is not in the list', () => {
    const draft: ReportDraft = {
      ...gpsDraft,
      location: { source: 'manual', districtId: 'x', landmark: 'Bridge' },
    };
    expect(
      row(buildReviewRows(draft, districts, capturedAt), 'Location').value,
    ).toBe('Bridge, Unknown district (entered manually)');
  });

  it('shows the file name of the photo', () => {
    const rows = buildReviewRows(
      { ...gpsDraft, photo: { fileName: 'slide.jpg' } },
      districts,
      capturedAt,
    );
    expect(row(rows, 'Photo').value).toBe('slide.jpg');
  });

  it('shows what the reporter typed for the other type', () => {
    const rows = buildReviewRows(
      { ...gpsDraft, hazardType: 'other', otherHazard: ' Fallen power line ' },
      districts,
      capturedAt,
    );
    expect(row(rows, 'Hazard type').value).toBe('Fallen power line');
  });

  it('shows placeholders for an unfinished draft', () => {
    const rows = buildReviewRows(EMPTY_DRAFT, districts, capturedAt);
    expect(row(rows, 'Hazard type').value).toBe('Not chosen');
    expect(row(rows, 'Location').value).toBe('Not set');
  });

  it('says the time is recorded automatically and cannot be edited', () => {
    const timeRow = row(
      buildReviewRows(gpsDraft, districts, capturedAt),
      'Date and time',
    );
    expect(timeRow.value).toMatch(/\(recorded automatically\)$/);
    expect(timeRow.editStep).toBeUndefined();
  });
});
