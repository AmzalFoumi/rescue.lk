import { useCallback, useState } from 'react';

interface ReviewDeps {
  confirm: () => Promise<boolean>;
  saveDraft: () => Promise<void>;
  clearFailure: () => void;
}

// usePublishReview controls the publish confirmation dialog: open it, confirm, or save
// a draft instead.
// SRP: only the dialog's flow; the actual saving is done by the functions passed in.
// ISP: it asks only for confirm, saveDraft and clearFailure, so it is easy to test.
export function usePublishReview({
  confirm,
  saveDraft,
  clearFailure,
}: ReviewDeps) {
  const [open, setOpen] = useState(false);

  const start = useCallback(() => {
    clearFailure();
    setOpen(true);
  }, [clearFailure]);

  // On failure the field errors are shown on step 4, as in the design.
  const confirmReview = useCallback(async () => {
    await confirm();
    setOpen(false);
  }, [confirm]);

  const saveDraftInstead = useCallback(() => {
    setOpen(false);
    void saveDraft();
  }, [saveDraft]);

  return {
    open,
    start,
    close: useCallback(() => setOpen(false), []),
    confirm: confirmReview,
    saveDraft: saveDraftInstead,
  };
}
