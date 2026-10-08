import { describe, expect, it } from 'vitest';
import {
  DRAFT_MESSAGES,
  EMPTY_DRAFT,
  MAX_DESCRIPTION_LENGTH,
  MIN_DESCRIPTION_LENGTH,
  firstInvalidStep,
  hasErrors,
  validateStep,
  type ReportDraft,
} from './report-draft';

const gps = {
  source: 'gps',
  fix: { latitude: 6.68, longitude: 80.39 },
} as const;

const validDraft: ReportDraft = {
  ...EMPTY_DRAFT,
  hazardType: 'flood',
  location: gps,
  description: 'Water is rising on Main Street',
};

describe('validateStep 1 (hazard type)', () => {
  it('asks for a hazard type when none is chosen', () => {
    expect(validateStep(1, EMPTY_DRAFT)).toEqual({
      hazardType: DRAFT_MESSAGES.hazardType,
    });
  });

  it('accepts a normal type', () => {
    expect(validateStep(1, { ...EMPTY_DRAFT, hazardType: 'fire' })).toEqual({});
  });

  it('asks what kind of hazard it is when "other" has no text', () => {
    const draft = {
      ...EMPTY_DRAFT,
      hazardType: 'other',
      otherHazard: '   ',
    } as const;
    expect(validateStep(1, draft)).toEqual({
      otherHazard: DRAFT_MESSAGES.otherHazard,
    });
  });

  it('accepts "other" with text', () => {
    const draft = {
      ...EMPTY_DRAFT,
      hazardType: 'other',
      otherHazard: 'Fallen power line',
    } as const;
    expect(validateStep(1, draft)).toEqual({});
  });
});

describe('validateStep 2 (location and description)', () => {
  it('reports both problems on an empty draft', () => {
    expect(validateStep(2, EMPTY_DRAFT)).toEqual({
      location: DRAFT_MESSAGES.locationMissing,
      description: DRAFT_MESSAGES.descriptionShort,
    });
  });

  it('accepts a GPS location and a long enough description', () => {
    expect(validateStep(2, validDraft)).toEqual({});
  });

  it('rejects a description of 9 characters and accepts 10', () => {
    const nine = {
      ...validDraft,
      description: 'a'.repeat(MIN_DESCRIPTION_LENGTH - 1),
    };
    const ten = {
      ...validDraft,
      description: 'a'.repeat(MIN_DESCRIPTION_LENGTH),
    };
    expect(validateStep(2, nine).description).toBe(
      DRAFT_MESSAGES.descriptionShort,
    );
    expect(validateStep(2, ten).description).toBeUndefined();
  });

  it('does not count spaces around the description', () => {
    const draft = { ...validDraft, description: `   short   ` };
    expect(validateStep(2, draft).description).toBe(
      DRAFT_MESSAGES.descriptionShort,
    );
  });

  it('rejects a description over the limit and accepts the limit itself', () => {
    const atLimit = {
      ...validDraft,
      description: 'a'.repeat(MAX_DESCRIPTION_LENGTH),
    };
    const over = {
      ...validDraft,
      description: 'a'.repeat(MAX_DESCRIPTION_LENGTH + 1),
    };
    expect(validateStep(2, atLimit).description).toBeUndefined();
    expect(validateStep(2, over).description).toBe(
      DRAFT_MESSAGES.descriptionLong,
    );
  });

  it('needs both a district and a landmark for a manual location', () => {
    const noDistrict = {
      ...validDraft,
      location: { source: 'manual', districtId: '', landmark: 'Bus stand' },
    } as const;
    const noLandmark = {
      ...validDraft,
      location: { source: 'manual', districtId: 'd1', landmark: '  ' },
    } as const;
    const complete = {
      ...validDraft,
      location: { source: 'manual', districtId: 'd1', landmark: 'Bus stand' },
    } as const;
    expect(validateStep(2, noDistrict).location).toBe(
      DRAFT_MESSAGES.locationIncomplete,
    );
    expect(validateStep(2, noLandmark).location).toBe(
      DRAFT_MESSAGES.locationIncomplete,
    );
    expect(validateStep(2, complete)).toEqual({});
  });
});

describe('validateStep 3 and 4', () => {
  it('has nothing to validate on the photo and review steps', () => {
    expect(validateStep(3, EMPTY_DRAFT)).toEqual({});
    expect(validateStep(4, EMPTY_DRAFT)).toEqual({});
  });
});

describe('hasErrors', () => {
  it('is true only when there is at least one error', () => {
    expect(hasErrors({})).toBe(false);
    expect(hasErrors({ location: 'x' })).toBe(true);
  });
});

describe('firstInvalidStep', () => {
  it('returns step 1 when the type is missing', () => {
    expect(firstInvalidStep(EMPTY_DRAFT)).toBe(1);
  });

  it('returns step 2 when only the details are wrong', () => {
    expect(firstInvalidStep({ ...validDraft, description: '' })).toBe(2);
  });

  it('returns null for a valid draft', () => {
    expect(firstInvalidStep(validDraft)).toBeNull();
  });
});
