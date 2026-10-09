import { useCallback, useMemo, useState } from 'react';
import type { TargetAreaDto, WarningDto } from '@rescue-lk/shared';
import { buildDeliveryView } from '../delivery';
import { useDeliveries } from './useDeliveries';
import { useDeliveryActions } from './useDeliveryActions';
import { useReachEstimate } from './useReachEstimate';

interface DeliveryScreenDeps {
  // The warning on step 5, or null when step 5 is not shown.
  warningId: string | null;
  warnings: readonly WarningDto[];
  areas: readonly TargetAreaDto[];
  onCancelled: () => void;
  notify: (message: string) => void;
}

// useDeliveryScreen gathers everything step 5 needs: the latest deliveries (polled
// while in progress), the view built from them, retries, and the cancel dialog.
// SRP: this keeps step 5's state out of WarningWorkflow, which only passes it on.
// It combines smaller hooks (useDeliveries, useDeliveryActions) and pure helpers
// (buildDeliveryView), so each part stays testable.
export function useDeliveryScreen({
  warningId,
  warnings,
  areas,
  onCancelled,
  notify,
}: DeliveryScreenDeps) {
  const deliveries = useDeliveries(warningId);
  const warning = warnings.find((candidate) => candidate.id === warningId);
  const reach = useReachEstimate(warning?.areaIds ?? []);
  const view = useMemo(
    () =>
      buildDeliveryView(warningId, {
        warnings,
        records: deliveries.data ?? [],
        reach: reach.data,
        areas,
      }),
    [warningId, warnings, deliveries.data, reach.data, areas],
  );

  const [cancelling, setCancelling] = useState(false);
  const actions = useDeliveryActions({
    afterRetry: deliveries.reload,
    afterCancel: () => {
      setCancelling(false);
      onCancelled();
    },
    notify,
  });
  const { clearFailure } = actions;

  return {
    deliveries,
    warning,
    view,
    actions,
    cancelling,
    openCancel: useCallback(() => {
      clearFailure();
      setCancelling(true);
    }, [clearFailure]),
    closeCancel: useCallback(() => setCancelling(false), []),
  };
}
