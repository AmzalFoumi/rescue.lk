'use client';

import { useCallback, useMemo, useReducer } from 'react';
import type { ReportDraft, WizardStep } from '../domain/report-draft';
import {
  INITIAL_WIZARD_STATE,
  reportWizardReducer,
  type WizardState,
} from './report-wizard-reducer';

export interface ReportWizard {
  state: WizardState;
  change: (changes: Partial<ReportDraft>) => void;
  next: () => void;
  back: () => void;
  goTo: (step: WizardStep) => void;
  checkAll: () => void;
  reset: () => void;
}

/** The 4-step report form: the reducer plus ready-made actions for the screens. */
export function useReportWizard(): ReportWizard {
  const [state, dispatch] = useReducer(
    reportWizardReducer,
    INITIAL_WIZARD_STATE,
  );

  const change = useCallback(
    (changes: Partial<ReportDraft>) => dispatch({ type: 'change', changes }),
    [],
  );
  const next = useCallback(() => dispatch({ type: 'next' }), []);
  const back = useCallback(() => dispatch({ type: 'back' }), []);
  const goTo = useCallback(
    (step: WizardStep) => dispatch({ type: 'goTo', step }),
    [],
  );
  const checkAll = useCallback(() => dispatch({ type: 'checkAll' }), []);
  const reset = useCallback(() => dispatch({ type: 'reset' }), []);

  return useMemo(
    () => ({ state, change, next, back, goTo, checkAll, reset }),
    [state, change, next, back, goTo, checkAll, reset],
  );
}
