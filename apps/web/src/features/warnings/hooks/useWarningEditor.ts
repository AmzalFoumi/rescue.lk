import { useCallback } from 'react';
import type {
  TargetAreaDto,
  VerifiedHazardReportDto,
  WarningDto,
} from '@rescue-lk/shared';
import {
  applySourceReport,
  blankForm,
  formFromWarning,
  levelStepErrors,
} from '../form';
import { shortId } from '../format';
import { districtAreaId } from '../monitoring';
import type { useWarningForm } from './useWarningForm';
import type { Editor, useWorkflowNavigation } from './useWorkflowNavigation';

interface EditorDeps {
  nav: ReturnType<typeof useWorkflowNavigation>;
  form: ReturnType<typeof useWarningForm>;
  reports: readonly VerifiedHazardReportDto[];
  areas: readonly TargetAreaDto[];
}

export const editorLabel = (editor: Editor | null): string => {
  if (editor?.mode === 'draft') {
    return `Draft ${shortId('W', editor.warningId)}`;
  }
  if (editor?.mode === 'update') {
    return `Updating ${shortId('W', editor.warningId)}`;
  }
  return 'New warning';
};

// useWarningEditor moves through the warning editor: create, open a draft or an active
// warning, choose a source report, continue, go back, update.
// SRP: it changes navigation and form state only and never calls the API; saving is
// useWarningSubmit's job.
export function useWarningEditor({ nav, form, reports, areas }: EditorDeps) {
  const { openEditor, openDelivery, openReview, toMonitor, goTo, state } = nav;
  const { load, update, setErrors, values } = form;

  const reportAreaFor = useCallback(
    (report: VerifiedHazardReportDto | undefined) =>
      report && districtAreaId(report.districtName, areas),
    [areas],
  );

  // A new warning, pre-filled from its source report when there is one.
  const createFrom = useCallback(
    (reportId: string | null) => {
      const report = reports.find((candidate) => candidate.id === reportId);
      load(blankForm(report, reportAreaFor(report)));
      openEditor({ mode: 'create' }, 'level', reportId);
    },
    [reports, reportAreaFor, load, openEditor],
  );

  // A draft opens in the editor; anything else shows its delivery status.
  const openWarning = useCallback(
    (warning: WarningDto) => {
      if (warning.status === 'DRAFT') {
        load(formFromWarning(warning));
        openEditor(
          { mode: 'draft', warningId: warning.id },
          'area',
          warning.sourceReportId,
        );
        return;
      }
      openDelivery(warning.id, warning.sourceReportId);
    },
    [load, openEditor, openDelivery],
  );

  const chooseSource = useCallback(
    (reportId: string) => {
      const report = reports.find((candidate) => candidate.id === reportId);
      update((current) =>
        applySourceReport(current, report, reportAreaFor(report)),
      );
    },
    [reports, reportAreaFor, update],
  );

  // Step 3 -> 4 only when the report, hazard and level are filled in.
  const continueToArea = useCallback(() => {
    const errors = levelStepErrors(values);
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }
    goTo('area');
  }, [values, setErrors, goTo]);

  // "Update warning" on step 5: edit the ACTIVE warning from step 3.
  const startUpdate = useCallback(
    (warning: WarningDto) => {
      load(formFromWarning(warning));
      openEditor(
        { mode: 'update', warningId: warning.id },
        'level',
        warning.sourceReportId,
      );
    },
    [load, openEditor],
  );

  // Back from step 3: to the warning being updated, the report, or monitoring.
  const backFromLevel = useCallback(() => {
    const { editor, reportId } = state;
    if (editor?.mode === 'update' && reportId) {
      openDelivery(editor.warningId, reportId);
    } else if (reportId) {
      openReview(reportId);
    } else {
      toMonitor();
    }
  }, [state, openDelivery, openReview, toMonitor]);

  return {
    createFrom,
    openWarning,
    chooseSource,
    continueToArea,
    backFromLevel,
    startUpdate,
  };
}
