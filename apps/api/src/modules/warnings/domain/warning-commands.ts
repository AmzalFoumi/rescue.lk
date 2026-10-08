import type { WarningContent, WarningForm } from './warning-form.js';

// Parameter objects for the UC1 actions, so no method takes a long list of
// loose arguments.

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
