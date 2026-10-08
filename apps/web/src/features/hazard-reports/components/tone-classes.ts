import type { StatusTone } from '../domain/report-status';

/** Tailwind classes for each tone (full names so Tailwind can find them). Tokens are in globals.css. */
export const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: 'border-neutral-bd bg-neutral-bg text-neutral-fg',
  caution: 'border-caution-bd bg-caution-bg text-caution-fg',
  success: 'border-success-bd bg-success-bg text-success-fg',
  danger: 'border-danger-bd bg-danger-bg text-danger-fg',
};

/** Shared look of text inputs, selects and text areas. */
export const INPUT_CLASS =
  'min-h-12 w-full rounded-[10px] border border-line-input bg-white px-3 py-2 text-ink focus-visible:outline-2 focus-visible:outline-primary';

/** Shared look of a white card with a border (the design uses borders, not shadows). */
export const CARD_CLASS = 'rounded-[10px] border border-line bg-white p-4';
