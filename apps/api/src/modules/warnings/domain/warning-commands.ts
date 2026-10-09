import type { WarningContent, WarningForm } from './warning-form.js';

// The command objects passed to WarningsService, one per UC1 action (submit, update,
// cancel).
// Parameter Object: each action takes one named object instead of a long list of
// loose arguments, so calls are easy to read and arguments cannot be swapped by
// mistake. Adding a field never changes a method signature.
// The controller builds them from the request DTOs, with help from warnings.mapper.

// Save a draft or publish: a new warning, or an existing draft when draftId is set.
export interface SubmitWarningCommand {
  form: WarningForm;
  createdBy: string;
  draftId?: string;
}

// Change an ACTIVE warning; the source report cannot change.
export interface UpdateWarningCommand {
  warningId: string;
  content: WarningContent;
}

export interface CancelWarningCommand {
  warningId: string;
  reason: string;
}
