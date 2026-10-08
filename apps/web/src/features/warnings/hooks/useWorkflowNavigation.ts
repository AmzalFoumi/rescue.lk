import { useCallback, useMemo, useState } from 'react';

// The five steps of the UC1 screen, in order.
export const WORKFLOW_STEPS = [
  { key: 'monitor', label: 'Hazard monitoring' },
  { key: 'review', label: 'Hazard review' },
  { key: 'level', label: 'Warning level' },
  { key: 'area', label: 'Area and message' },
  { key: 'delivery', label: 'Delivery status' },
] as const;

export type WorkflowStep = (typeof WORKFLOW_STEPS)[number]['key'];

// What the warning editor (steps 3 and 4) is working on.
export type Editor =
  | { mode: 'create' }
  | { mode: 'draft'; warningId: string }
  | { mode: 'update'; warningId: string };

export interface WorkflowState {
  step: WorkflowStep;
  reportId: string | null;
  warningId: string | null;
  editor: Editor | null;
}

export interface StepView {
  key: WorkflowStep;
  label: string;
  number: number;
  state: 'done' | 'current' | 'upcoming';
  canOpen: boolean;
}

const INITIAL: WorkflowState = {
  step: 'monitor',
  reportId: null,
  warningId: null,
  editor: null,
};

const indexOf = (step: WorkflowStep) =>
  WORKFLOW_STEPS.findIndex((candidate) => candidate.key === step);

// A finished step can be reopened when it still has something to show.
const canReopen = (step: WorkflowStep, state: WorkflowState) =>
  indexOf(step) < indexOf(state.step) &&
  (step === 'monitor' ||
    (step === 'review' && state.reportId !== null) ||
    (step === 'level' && state.editor !== null));

// Which step of the UC1 workflow is shown and what it is about.
export function useWorkflowNavigation() {
  const [state, setState] = useState<WorkflowState>(INITIAL);

  const toMonitor = useCallback(
    () =>
      setState((current) => ({
        ...current,
        step: 'monitor',
        warningId: null,
        editor: null,
      })),
    [],
  );

  const openReview = useCallback(
    (reportId: string) =>
      setState({ step: 'review', reportId, warningId: null, editor: null }),
    [],
  );

  const openEditor = useCallback(
    (editor: Editor, step: 'level' | 'area', reportId: string | null) =>
      setState({ step, reportId, warningId: null, editor }),
    [],
  );

  const openDelivery = useCallback(
    (warningId: string, reportId: string) =>
      setState({ step: 'delivery', reportId, warningId, editor: null }),
    [],
  );

  const goTo = useCallback(
    (step: WorkflowStep) =>
      setState((current) => {
        const forwardInEditor = current.step === 'level' && step === 'area';
        if (!canReopen(step, current) && !forwardInEditor) {
          return current;
        }
        return step === 'monitor' || step === 'review'
          ? { ...current, step, warningId: null, editor: null }
          : { ...current, step };
      }),
    [],
  );

  const steps = useMemo<StepView[]>(
    () =>
      WORKFLOW_STEPS.map(({ key, label }, index) => ({
        key,
        label,
        number: index + 1,
        state:
          index < indexOf(state.step)
            ? 'done'
            : key === state.step
              ? 'current'
              : 'upcoming',
        canOpen: canReopen(key, state),
      })),
    [state],
  );

  return {
    state,
    steps,
    toMonitor,
    openReview,
    openEditor,
    openDelivery,
    goTo,
  };
}
