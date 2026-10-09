import { describe, expect, it } from 'vitest';
import type { DistrictDto } from '@rescue-lk/shared';
import { buildSubmission, type SubmissionContext } from './build-submission';
import { DEMO_CITIZEN } from './identities';
import { EMPTY_DRAFT, type ReportDraft } from './report-draft';

const ratnapura: DistrictDto = {
  id: 'd-rat',
  name: 'Ratnapura',
  province: 'Sabaragamuwa',
  latitude: 6.6828,
  longitude: 80.3992,
};
const galle: DistrictDto = {
  id: 'd-gal',
  name: 'Galle',
  province: 'Southern',
  latitude: 6.0535,
  longitude: 80.221,
};

const context: SubmissionContext = {
  reporter: DEMO_CITIZEN,
  homeDistrict: ratnapura,
  districts: [ratnapura, galle],
  now: new Date('2026-10-08T10:00:00Z'),
};

const gpsDraft: ReportDraft = {
  ...EMPTY_DRAFT,
  hazardType: 'flood',
  description: '  Water is rising on Main Street  ',
  location: {
    source: 'gps',
    fix: { latitude: 6.7, longitude: 80.4, accuracyMetres: 12 },
  },
};

describe('buildSubmission with a GPS location', () => {
  const request = buildSubmission(gpsDraft, context);

  it('uses the phone position and files it under the home district', () => {
    expect(request.location).toEqual({ latitude: 6.7, longitude: 80.4 });
    expect(request.district).toBe('d-rat');
  });

  it('trims the description and records the time and the reporter', () => {
    expect(request.description).toBe('Water is rising on Main Street');
    expect(request.capturedAt).toBe('2026-10-08T10:00:00.000Z');
    expect(request).toMatchObject({
      reporterId: 'citizen-nimal',
      reporterName: 'Nimal Perera',
      reporterRole: 'citizen',
    });
  });

  it('leaves out the optional fields that are not used', () => {
    expect(request).not.toHaveProperty('photoUrl');
    expect(request).not.toHaveProperty('placeName');
    expect(request).not.toHaveProperty('otherHazard');
  });
});

describe('buildSubmission with a manual location', () => {
  const draft: ReportDraft = {
    ...gpsDraft,
    location: {
      source: 'manual',
      districtId: 'd-gal',
      landmark: ' Fort bus stand ',
    },
  };

  it('uses the centre of the chosen district and the landmark as the place name', () => {
    const request = buildSubmission(draft, context);
    expect(request.location).toEqual({ latitude: 6.0535, longitude: 80.221 });
    expect(request.district).toBe('d-gal');
    expect(request.placeName).toBe('Fort bus stand');
  });

  it('throws when the chosen district is not in the list', () => {
    const unknown: ReportDraft = {
      ...draft,
      location: { source: 'manual', districtId: 'nope', landmark: 'x' },
    };
    expect(() => buildSubmission(unknown, context)).toThrow('Unknown district');
  });
});

describe('buildSubmission, other fields', () => {
  it('sends the typed text only for the "other" type', () => {
    const other = buildSubmission(
      { ...gpsDraft, hazardType: 'other', otherHazard: ' Fallen power line ' },
      context,
    );
    const flood = buildSubmission(
      { ...gpsDraft, otherHazard: 'ignored' },
      context,
    );
    expect(other.otherHazard).toBe('Fallen power line');
    expect(flood).not.toHaveProperty('otherHazard');
  });

  it('sends a photo URL built from the file name', () => {
    const request = buildSubmission(
      { ...gpsDraft, photo: { fileName: 'flood.jpg' } },
      context,
    );
    expect(request.photoUrl).toBe('https://photos.rescue.lk/mock/flood.jpg');
  });

  it('refuses an incomplete draft', () => {
    expect(() => buildSubmission(EMPTY_DRAFT, context)).toThrow('incomplete');
    expect(() =>
      buildSubmission({ ...gpsDraft, location: null }, context),
    ).toThrow('incomplete');
  });
});
