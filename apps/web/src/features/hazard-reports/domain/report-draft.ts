import type { HazardType } from '@rescue-lk/shared';

export const MIN_DESCRIPTION_LENGTH = 10;
export const MAX_DESCRIPTION_LENGTH = 1000;

export const TOTAL_STEPS = 4;

/** The four screens of the report form. */
export type WizardStep = 1 | 2 | 3 | 4;

export interface GpsFix {
  latitude: number;
  longitude: number;
  /** How close the phone says the position is, in metres. */
  accuracyMetres?: number;
}

/** Where the hazard is: a GPS position or a district and landmark typed by hand. */
export type LocationDraft =
  | { source: 'gps'; fix: GpsFix }
  | { source: 'manual'; districtId: string; landmark: string };

export interface PhotoDraft {
  fileName: string;
}

/** What the reporter has entered so far. */
export interface ReportDraft {
  hazardType: HazardType | null;
  /** Only used when the type is "other". */
  otherHazard: string;
  location: LocationDraft | null;
  description: string;
  photo: PhotoDraft | null;
}

export const EMPTY_DRAFT: ReportDraft = {
  hazardType: null,
  otherHazard: '',
  location: null,
  description: '',
  photo: null,
};

export type DraftField =
  'hazardType' | 'otherHazard' | 'location' | 'description';

/** One error message per field that is wrong. */
export type DraftErrors = Partial<Record<DraftField, string>>;

export const DRAFT_MESSAGES = {
  hazardType: 'Choose the type of hazard.',
  otherHazard: 'Say what kind of hazard it is.',
  locationMissing: 'Your location is not available yet. Enter it manually.',
  locationIncomplete:
    'Choose a district and enter the nearest town or landmark.',
  descriptionShort: `Describe what you see in at least ${MIN_DESCRIPTION_LENGTH} characters.`,
  descriptionLong: `Keep the description under ${MAX_DESCRIPTION_LENGTH} characters.`,
} as const;

function validateType(draft: ReportDraft): DraftErrors {
  if (draft.hazardType === null)
    return { hazardType: DRAFT_MESSAGES.hazardType };
  if (draft.hazardType === 'other' && draft.otherHazard.trim() === '') {
    return { otherHazard: DRAFT_MESSAGES.otherHazard };
  }
  return {};
}

function validateLocation(location: LocationDraft | null): string | undefined {
  if (location === null) return DRAFT_MESSAGES.locationMissing;
  if (
    location.source === 'manual' &&
    (location.districtId === '' || location.landmark.trim() === '')
  ) {
    return DRAFT_MESSAGES.locationIncomplete;
  }
  return undefined;
}

function validateDescription(description: string): string | undefined {
  const length = description.trim().length;
  if (length < MIN_DESCRIPTION_LENGTH) return DRAFT_MESSAGES.descriptionShort;
  if (length > MAX_DESCRIPTION_LENGTH) return DRAFT_MESSAGES.descriptionLong;
  return undefined;
}

function validateDetails(draft: ReportDraft): DraftErrors {
  const errors: DraftErrors = {};
  const location = validateLocation(draft.location);
  const description = validateDescription(draft.description);
  if (location) errors.location = location;
  if (description) errors.description = description;
  return errors;
}

/** The errors of one step. The photo and review steps have nothing to validate. */
export function validateStep(
  step: WizardStep,
  draft: ReportDraft,
): DraftErrors {
  if (step === 1) return validateType(draft);
  if (step === 2) return validateDetails(draft);
  return {};
}

export function hasErrors(errors: DraftErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** The first step that has errors, or null when the whole draft is valid. */
export function firstInvalidStep(draft: ReportDraft): WizardStep | null {
  const steps: WizardStep[] = [1, 2];
  return steps.find((step) => hasErrors(validateStep(step, draft))) ?? null;
}
