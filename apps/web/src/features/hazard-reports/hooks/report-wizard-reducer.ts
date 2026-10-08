import {
  EMPTY_DRAFT,
  firstInvalidStep,
  hasErrors,
  validateStep,
  type DraftErrors,
  type ReportDraft,
  type WizardStep,
} from '../domain/report-draft';

export interface WizardState {
  step: WizardStep;
  draft: ReportDraft;
  errors: DraftErrors;
}

export type WizardAction =
  | { type: 'change'; changes: Partial<ReportDraft> }
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'goTo'; step: WizardStep }
  | { type: 'checkAll' }
  | { type: 'reset' };

export const INITIAL_WIZARD_STATE: WizardState = {
  step: 1,
  draft: EMPTY_DRAFT,
  errors: {},
};

const LAST_STEP: WizardStep = 4;

function previous(step: WizardStep): WizardStep {
  return step > 1 ? ((step - 1) as WizardStep) : step;
}

function following(step: WizardStep): WizardStep {
  return step < LAST_STEP ? ((step + 1) as WizardStep) : step;
}

/**
 * The state of the 4-step report form. Pure, so it is easy to test.
 * Errors only appear after the reporter tries to continue, and then clear as soon as they are fixed.
 */
export function reportWizardReducer(
  state: WizardState,
  action: WizardAction,
): WizardState {
  switch (action.type) {
    case 'change': {
      const draft = { ...state.draft, ...action.changes };
      const errors = hasErrors(state.errors)
        ? validateStep(state.step, draft)
        : state.errors;
      return { ...state, draft, errors };
    }
    case 'next': {
      const errors = validateStep(state.step, state.draft);
      return hasErrors(errors)
        ? { ...state, errors }
        : { ...state, step: following(state.step), errors: {} };
    }
    case 'back':
      return { ...state, step: previous(state.step), errors: {} };
    case 'goTo':
      return { ...state, step: action.step, errors: {} };
    case 'checkAll': {
      // Before sending: go back to the first screen that has a problem.
      const step = firstInvalidStep(state.draft);
      return step === null
        ? state
        : { ...state, step, errors: validateStep(step, state.draft) };
    }
    case 'reset':
      return INITIAL_WIZARD_STATE;
  }
}
