import { CircleCheck, X } from 'lucide-react';
import { ICON_SIZE } from '../../ui';

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
}

// Toast shows a short confirmation, e.g. "Warning published".
// Presentational. SRP: useToast owns the timing; this only renders.
// Accessibility: the live region is always present, so screen readers never miss the
// announcement.
export function Toast({ message, onDismiss }: ToastProps) {
  return (
    <div role="status" aria-live="polite">
      {message && (
        <div className="fixed bottom-6 left-1/2 z-[80] flex max-w-[min(600px,calc(100vw-32px))] -translate-x-1/2 items-center gap-2.5 rounded-[8px] bg-[#17212B] px-4 py-3 text-[14px] text-white shadow-[0_12px_32px_rgba(23,33,43,0.3)]">
          <CircleCheck
            aria-hidden
            size={ICON_SIZE.large}
            className="flex-none"
          />
          <span>{message}</span>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="ml-1 rounded p-0.5 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            <X aria-hidden size={ICON_SIZE.medium} />
          </button>
        </div>
      )}
    </div>
  );
}
