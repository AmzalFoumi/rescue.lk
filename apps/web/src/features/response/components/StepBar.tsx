const STEPS = ['Choose an incident', 'Choose a team', 'Confirm dispatch'];

/** Where the officer is in the dispatch flow, and what comes next. */
export function StepBar({ current }: { current: number }) {
  return (
    <ol aria-label="Dispatch steps" className="grid gap-2 sm:grid-cols-3">
      {STEPS.map((label, index) => {
        const done = index < current;
        const now = index === current;
        const state = done ? 'Done' : now ? 'Now' : 'Next';
        return (
          <li
            key={label}
            aria-current={now ? 'step' : undefined}
            className={`flex items-center gap-3 rounded-[8px] border px-3 py-2.5 ${
              now ? 'border-primary bg-primary-tint' : 'border-line bg-white'
            }`}
          >
            <span
              className={`grid size-7 flex-none place-items-center rounded-full text-[13px] font-bold ${
                done
                  ? 'bg-success-bg text-success-fg'
                  : now
                    ? 'bg-primary text-white'
                    : 'bg-neutral-bg text-neutral-fg'
              }`}
            >
              {done ? '✓' : index + 1}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Step {index + 1} · {state}
              </span>
              <span className="text-sm font-semibold">{label}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
