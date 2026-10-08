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

// An action was attempted on a warning in the wrong lifecycle state
// (DRAFT -> ACTIVE -> CANCELLED).
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
