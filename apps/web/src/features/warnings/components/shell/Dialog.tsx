'use client';

import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';

interface DialogProps {
  titleId: string;
  onClose: () => void;
  children: ReactNode;
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])';

// A modal dialog: focus moves inside and stays there, Escape closes it, and
// focus returns to where it was when the dialog closes.
export function Dialog({ titleId, onClose, children }: DialogProps) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const first = panel.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel.current)?.focus();
    return () => opener?.focus();
  }, []);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== 'Tab' || !panel.current) {
      return;
    }
    const focusable = [
      ...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE),
    ];
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-[#17212B]/50 p-4">
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="max-h-[calc(100vh-32px)] w-[min(600px,100%)] overflow-auto rounded-[12px] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.25)] focus:outline-none"
      >
        {children}
      </div>
    </div>
  );
}
