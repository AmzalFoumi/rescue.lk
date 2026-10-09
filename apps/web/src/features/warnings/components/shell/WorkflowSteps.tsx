import { Check } from 'lucide-react';
import type { StepView, WorkflowStep } from '../../hooks/useWorkflowNavigation';
import { cx, ICON_SIZE } from '../../ui';

interface WorkflowStepsProps {
  steps: readonly StepView[];
  onOpen: (step: WorkflowStep) => void;
}

const BUTTON: Record<StepView['state'], string> = {
  current: 'border-[#1D4E89] bg-[#E8EFF8] text-[#17212B]',
  done: 'border-[#D9DFE5] bg-white text-[#17212B]',
  upcoming: 'border-[#D9DFE5] bg-white text-[#5B6773]',
};

const NUMBER: Record<StepView['state'], string> = {
  current: 'bg-[#1D4E89] text-white',
  done: 'bg-[#1B6A3B] text-white',
  upcoming: 'bg-[#E1E6EB] text-[#46525F]',
};

// One clear name per step for screen readers: "Step 1: Hazard monitoring (done)".
const stepName = ({ number, label, state }: StepView) =>
  `Step ${number}: ${label}${state === 'done' ? ' (done)' : ''}`;

// WorkflowSteps is the step bar at the top of the screen.
// Presentational: finished steps with something to show can be reopened, but the
// canReopen rule itself lives in useWorkflowNavigation (SRP).
// Accessibility: each step has one clear name, e.g. "Step 1: Hazard monitoring (done)".
export function WorkflowSteps({ steps, onOpen }: WorkflowStepsProps) {
  return (
    <ol
      aria-label="Warning workflow"
      className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-1.5"
    >
      {steps.map((step) => (
        <li key={step.key}>
          <button
            type="button"
            aria-current={step.state === 'current' ? 'step' : undefined}
            aria-label={stepName(step)}
            disabled={!step.canOpen && step.state !== 'current'}
            onClick={() => step.canOpen && onOpen(step.key)}
            className={cx(
              'flex h-full w-full items-center gap-2.5 rounded-[8px] border px-3 py-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4E89]',
              BUTTON[step.state],
              step.canOpen
                ? 'cursor-pointer hover:bg-[#F3F5F7]'
                : 'cursor-default',
            )}
          >
            <span
              aria-hidden
              className={cx(
                'grid size-[26px] flex-none place-items-center rounded-full text-[13px] font-bold',
                NUMBER[step.state],
              )}
            >
              {step.state === 'done' ? (
                <Check aria-hidden size={ICON_SIZE.small} />
              ) : (
                step.number
              )}
            </span>
            <span aria-hidden className="flex flex-col leading-tight">
              <span className="text-[11.5px] text-[#4F5B67]">
                Step {step.number}
              </span>
              <span className="text-[13.5px] font-semibold">{step.label}</span>
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}
