import { useCallback, useEffect, useRef, useState } from 'react';
import { TOAST_DURATION_MS } from '../constants';

// useToast shows a short confirmation and hides it after TOAST_DURATION_MS (no magic
// number).
// SRP: only the timing; the Toast component renders it.
export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const show = useCallback((text: string) => {
    clearTimer();
    setMessage(text);
    timer.current = setTimeout(() => setMessage(null), TOAST_DURATION_MS);
  }, []);

  const dismiss = useCallback(() => {
    clearTimer();
    setMessage(null);
  }, []);

  useEffect(() => clearTimer, []);

  return { message, show, dismiss };
}
