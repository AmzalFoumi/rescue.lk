import type { DeliveryRecordEntry } from '../delivery-records.repository.interface.js';
import type { WarningRecord } from '../warnings.repository.interface.js';

// retryRefusal is the business rule for a manual retry: only a FAILED delivery of the
// current version of an ACTIVE warning may be retried.
// SRP: the rule is kept apart from the code that sends, so it can be read and tested
// on its own, and changing the rule never touches the delivery flow.
// It returns the reason a retry is refused, or null when it is allowed; the caller
// turns a reason into a DeliveryNotRetryableException (409).
export const retryRefusal = (
  record: DeliveryRecordEntry,
  warning: WarningRecord,
): string | null => {
  if (record.status !== 'FAILED') {
    return `it is ${record.status}; only FAILED deliveries can be retried`;
  }
  if (warning.status !== 'ACTIVE') {
    return `warning ${warning.id} is ${warning.status}`;
  }
  if (record.warningVersion !== warning.version) {
    return `it belongs to version ${record.warningVersion}, but the warning is now version ${warning.version}`;
  }
  return null;
};
