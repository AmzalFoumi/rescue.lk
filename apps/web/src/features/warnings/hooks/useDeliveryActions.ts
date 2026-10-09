import { useCallback } from 'react';
import type { DeliveryRecordDto } from '@rescue-lk/shared';
import { api } from '@/lib/api';
import { shortId } from '../format';
import { useWarningActions } from './useWarningActions';

interface DeliveryActionDeps {
  // Refresh the delivery table after a retry, whether or not it worked.
  afterRetry: () => void;
  afterCancel: () => void;
  notify: (message: string) => void;
}

// useDeliveryActions holds the step 5 actions: retry failed channels and cancel an
// ACTIVE warning.
// SRP: actions only; the data comes from useDeliveries.
// Failures are kept as ApiErrors for the UI to show, never swallowed.
export function useDeliveryActions({
  afterRetry,
  afterCancel,
  notify,
}: DeliveryActionDeps) {
  const { pending, run, errorOf, clearFailure } = useWarningActions();

  const retry = useCallback(
    async (recordId: string) => {
      await run('retry', () => api.warnings.retryDelivery(recordId));
      afterRetry();
    },
    [run, afterRetry],
  );

  const retryAll = useCallback(
    async (records: readonly DeliveryRecordDto[]) => {
      const done = await run('retry', () =>
        Promise.all(
          records.map((record) => api.warnings.retryDelivery(record.id)),
        ),
      );
      afterRetry();
      if (done) {
        notify(`Retrying ${records.length} failed channels.`);
      }
    },
    [run, afterRetry, notify],
  );

  // True when the warning was cancelled; otherwise the error stays to show.
  const cancel = useCallback(
    async (warningId: string, reason: string): Promise<boolean> => {
      const cancelled = await run('cancel', () =>
        api.warnings.cancel(warningId, { reason }),
      );
      if (!cancelled) {
        return false;
      }
      afterCancel();
      notify(
        `${shortId('W', warningId)} cancelled. It no longer appears in the Citizen App.`,
      );
      return true;
    },
    [run, afterCancel, notify],
  );

  return {
    pending,
    retry,
    retryAll,
    retryError: errorOf('retry'),
    cancel,
    cancelError: errorOf('cancel'),
    clearFailure,
  };
}
