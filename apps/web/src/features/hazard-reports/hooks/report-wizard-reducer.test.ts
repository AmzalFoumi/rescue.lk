import { describe, expect, it } from 'vitest';
import {
  DRAFT_MESSAGES,
  EMPTY_DRAFT,
  type ReportDraft,
} from '../domain/report-draft';
import {
  INITIAL_WIZARD_STATE,
  reportWizardReducer,
  type WizardState,
} from './report-wizard-reducer';

const validDraft: ReportDraft = {
  ...EMPTY_DRAFT,
  hazardType: 'flood',
  location: { source: 'gps', fix: { latitude: 6.7, longitude: 80.4 } },
  description: 'Water is rising on Main Street',
};

const at = (
  step: WizardState['step'],
  draft: ReportDraft = EMPTY_DRAFT,
): WizardState => ({ step, draft, errors: {} });

describe('reportWizardReducer: next', () => {
  it('stays on step 1 and shows the error when no type is chosen', () => {
    const state = reportWizardReducer(INITIAL_WIZARD_STATE, { type: 'next' });
    expect(state.step).toBe(1);
    expect(state.errors).toEqual({ hazardType: DRAFT_MESSAGES.hazardType });
  });

  it('moves on when the step is valid', () => {
    const state = reportWizardReducer(
      at(1, { ...EMPTY_DRAFT, hazardType: 'fire' }),
      { type: 'next' },
    );
    expect(state.step).toBe(2);
    expect(state.errors).toEqual({});
  });

  it('lets the photo step be skipped without a photo', () => {
    expect(reportWizardReducer(at(3, validDraft), { type: 'next' }).step).toBe(
      4,
    );
  });

  it('stays on the last step', () => {
    expect(reportWizardReducer(at(4, validDraft), { type: 'next' }).step).toBe(
      4,
    );
  });
});

describe('reportWizardReducer: change', () => {
  it('updates the draft', () => {
    const state = reportWizardReducer(INITIAL_WIZARD_STATE, {
      type: 'change',
      changes: { hazardType: 'fire' },
    });
    expect(state.draft.hazardType).toBe('fire');
  });

  it('does not show errors before the reporter tried to continue', () => {
    const state = reportWizardReducer(at(2), {
      type: 'change',
      changes: { description: 'short' },
    });
    expect(state.errors).toEqual({});
  });

  it('clears an error as soon as the field is fixed', () => {
    const failed = reportWizardReducer(at(1), { type: 'next' });
    expect(failed.errors.hazardType).toBeDefined();

    const fixed = reportWizardReducer(failed, {
      type: 'change',
      changes: { hazardType: 'fire' },
    });
    expect(fixed.errors).toEqual({});
  });

  it('keeps showing an error while the field is still wrong', () => {
    const failed = reportWizardReducer(at(2), { type: 'next' });
    const state = reportWizardReducer(failed, {
      type: 'change',
      changes: { description: 'too short' },
    });
    expect(state.errors.description).toBe(DRAFT_MESSAGES.descriptionShort);
  });
});

describe('reportWizardReducer: back, goTo, reset', () => {
  it('goes back one step and clears errors', () => {
    const state = reportWizardReducer(
      { ...at(3), errors: { location: 'x' } },
      { type: 'back' },
    );
    expect(state.step).toBe(2);
    expect(state.errors).toEqual({});
  });

  it('stays on step 1 when going back from the first step', () => {
    expect(reportWizardReducer(at(1), { type: 'back' }).step).toBe(1);
  });

  it('jumps to a step for the Edit links', () => {
    expect(
      reportWizardReducer(at(4, validDraft), { type: 'goTo', step: 2 }).step,
    ).toBe(2);
  });

  it('starts again from an empty form', () => {
    expect(reportWizardReducer(at(4, validDraft), { type: 'reset' })).toEqual(
      INITIAL_WIZARD_STATE,
    );
  });
});

describe('reportWizardReducer: checkAll', () => {
  it('sends the reporter back to the first screen with a problem', () => {
    const state = reportWizardReducer(
      at(4, { ...validDraft, description: '' }),
      { type: 'checkAll' },
    );
    expect(state.step).toBe(2);
    expect(state.errors.description).toBe(DRAFT_MESSAGES.descriptionShort);
  });

  it('changes nothing when everything is valid', () => {
    const before = at(4, validDraft);
    expect(reportWizardReducer(before, { type: 'checkAll' })).toBe(before);
  });
});
