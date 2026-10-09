import { ConflictException } from '@nestjs/common';
import type { WarningStatus } from '@rescue-lk/shared';

export type WarningAction = 'edit' | 'publish' | 'update' | 'cancel';

// Parameter object describing the refused transition.
export interface WarningStatusConflict {
  warningId: string;
  action: WarningAction;
  currentStatus: WarningStatus;
  requiredStatus: WarningStatus;
}

// WarningStatusConflictException (409): an action was tried on a warning in the wrong
// lifecycle state, e.g. cancelling a DRAFT (DRAFT -> ACTIVE -> CANCELLED).
// Parameter Object: it takes one WarningStatusConflict object, so the message always
// names the action and both statuses.
// It extends ConflictException, so the global AllExceptionsFilter sets the status.
export class WarningStatusConflictException extends ConflictException {
  constructor({
    warningId,
    action,
    currentStatus,
    requiredStatus,
  }: WarningStatusConflict) {
    super(
      `Cannot ${action} warning ${warningId}: it is ${currentStatus}, but this needs a ${requiredStatus} warning`,
    );
  }
}
