import { useCallback, useEffect, useRef, useState } from 'react';
import { TOAST_DURATION_MS } from '../constants';

// A short confirmation shown at the bottom of the screen, then hidden.
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
