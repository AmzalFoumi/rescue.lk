import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { Presentation, Tone } from '../domain/presentation';
import { Icon } from './icons';

/** The small building blocks the UC3 screens are made of. */

export const TONE_CLASSES: Record<Tone, string> = {
  neutral: 'border-neutral-bd bg-neutral-bg text-neutral-fg',
  info: 'border-info-bd bg-info-bg text-info-fg',
  caution: 'border-caution-bd bg-caution-bg text-caution-fg',
  success: 'border-success-bd bg-success-bg text-success-fg',
  danger: 'border-danger-bd bg-danger-bg text-danger-fg',
};

export const INPUT_CLASS =
  'min-h-10 w-full rounded-[8px] border border-line-input bg-white px-3 text-ink focus-visible:outline-2 focus-visible:outline-primary';

type ButtonVariant = 'primary' | 'outline' | 'danger';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  outline: 'border border-line-input bg-white text-ink hover:bg-page',
  danger: 'border border-danger-bd bg-white text-danger-fg hover:bg-danger-bg',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-[8px] px-4 font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}

/** A coloured label. Colour is always paired with an icon and a word. */
export function Chip({ presentation }: { presentation: Presentation }) {
  const { label, tone, icon } = presentation;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${TONE_CLASSES[tone]}`}
    >
      <Icon name={icon} className="size-3.5" />
      {label}
    </span>
  );
}

/** A white panel with a heading, the shape every table and form sits in. */
export function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[10px] border border-line bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-page px-4 py-3">
        <h2 className="text-[15px] font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

type StateKind = 'loading' | 'error' | 'empty';

const DEFAULT_MESSAGES: Record<StateKind, string> = {
  loading: 'Loading…',
  error: 'Something went wrong.',
  empty: 'Nothing here yet.',
};

/** The three states every list needs besides "has data". */
export function StateMessage({
  kind,
  message = DEFAULT_MESSAGES[kind],
  onRetry,
}: {
  kind: StateKind;
  message?: string;
  onRetry?: () => void;
}) {
  if (kind === 'error') {
    return (
      <div
        role="alert"
        className="space-y-3 rounded-[10px] border border-danger-bd bg-danger-bg p-4 text-danger-fg"
      >
        <p>{message}</p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    );
  }
  return (
    <p
      role={kind === 'loading' ? 'status' : undefined}
      className="px-4 py-6 text-center text-ink-muted"
    >
      {message}
    </p>
  );
}

/** A message about something the officer just tried. */
export function Notice({
  tone,
  children,
  onDismiss,
}: {
  tone: Tone;
  children: ReactNode;
  onDismiss?: () => void;
}) {
  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-[8px] border px-3 py-2.5 text-sm ${TONE_CLASSES[tone]}`}
    >
      <span className="flex-1">{children}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss message"
          className="font-bold"
        >
          ×
        </button>
      )}
    </div>
  );
}

/** A labelled field, so every filter and input is announced the same way. */
export function Field({
  id,
  label,
  children,
  error,
}: {
  id: string;
  label: string;
  children: ReactNode;
  error?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-ink">
        {label}
      </label>
      {children}
      {error && (
        <span className="text-xs text-danger-fg" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
