import { useCallback } from 'react';
import type { WarningFormErrors } from '@rescue-lk/shared';
import { api } from '@/lib/api';
import type { ApiError } from '@/lib/api-error';
import { CREATED_BY } from '../constants';
import {
  toSubmitRequest,
  toUpdateRequest,
  type WarningFormValues,
} from '../form';
import { shortId } from '../format';
import { useWarningActions } from './useWarningActions';
import type { Editor } from './useWorkflowNavigation';

// Only what submitting needs, so it can be used and tested on its own.
interface SubmitDeps {
  editor: Editor | null;
  values: WarningFormValues;
  setErrors: (errors: WarningFormErrors) => void;
  openDelivery: (warningId: string, reportId: string) => void;
  toMonitor: () => void;
  // Called after the API saved a change, e.g. to reload the warning list.
  afterChange: () => void;
  notify: (message: string) => void;
  onDraftSaved: () => void;
}

const channelCount = (count: number) =>
  `${count} channel${count === 1 ? '' : 's'}`;

// Saving a draft and publishing or updating a warning (sequence diagram
// steps 8-10). API field errors go back into the form, next to their inputs.
export function useWarningSubmit({
  editor,
  values,
  setErrors,
  openDelivery,
  toMonitor,
  afterChange,
  notify,
  onDraftSaved,
}: SubmitDeps) {
  const { pending, run, errorOf, clearFailure } = useWarningActions();
  const draftId = editor?.mode === 'draft' ? editor.warningId : undefined;

  // Field errors from the API are shown next to their inputs.
  const showFieldErrors = useCallback(
    (error: ApiError) => setErrors(error.fieldErrors),
    [setErrors],
  );

  const saveDraft = useCallback(async () => {
    const draft = await run(
      'saveDraft',
      () =>
        api.warnings.saveDraft(
          toSubmitRequest(values, { createdBy: CREATED_BY, draftId }),
        ),
      showFieldErrors,
    );
    if (!draft) {
      return;
    }
    afterChange();
    onDraftSaved();
    toMonitor();
    notify(
      `Draft ${shortId('W', draft.id)} saved. It has not been sent to citizens.`,
    );
  }, [
    run,
    values,
    draftId,
    showFieldErrors,
    afterChange,
    onDraftSaved,
    toMonitor,
    notify,
  ]);

  // Publishes a new warning or a draft, or sends an update; true on success.
  const confirm = useCallback(async (): Promise<boolean> => {
    const updating = editor?.mode === 'update';
    const result = await run(
      updating ? 'update' : 'publish',
      () =>
        updating
          ? api.warnings.update(editor.warningId, toUpdateRequest(values))
          : api.warnings.publish(
              toSubmitRequest(values, { createdBy: CREATED_BY, draftId }),
            ),
      showFieldErrors,
    );
    if (!result) {
      return false;
    }
    const { warning } = result;
    afterChange();
    openDelivery(warning.id, warning.sourceReportId);
    notify(
      `${shortId('W', warning.id)} ${updating ? 'updated' : 'published'}. Sending on ${channelCount(warning.channels.length)}.`,
    );
    return true;
  }, [
    editor,
    run,
    values,
    draftId,
    showFieldErrors,
    afterChange,
    openDelivery,
    notify,
  ]);

  const failure = errorOf('saveDraft', 'publish', 'update');

  return {
    pending,
    failure,
    clearFailure,
    saveDraft,
    confirm,
  };
}
