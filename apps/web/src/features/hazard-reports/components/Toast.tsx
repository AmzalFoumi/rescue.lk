import { Button } from './Button';

interface ToastProps {
  message: string;
  onDismiss: () => void;
}

/** A short confirmation at the bottom of the screen. */
export function Toast({ message, onDismiss }: ToastProps) {
  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-[10px] bg-ink px-4 py-3 text-white shadow-lg"
    >
      <span>{message}</span>
      <Button
        variant="outline"
        className="min-h-9 px-3 text-ink"
        onClick={onDismiss}
      >
        Dismiss
      </Button>
    </div>
  );
}
