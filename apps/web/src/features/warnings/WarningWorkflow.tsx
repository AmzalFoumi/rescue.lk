'use client';

import { useMemo } from 'react';
import { cancelDescription, shortId } from './format';
import { resolveDistricts } from './monitoring';
import { publishReviewText } from './publishing';
import { buildReviewView } from './review';
import { useDeliveryScreen } from './hooks/useDeliveryScreen';
import { useLevelScreen } from './hooks/useLevelScreen';
import { useMonitorScreen } from './hooks/useMonitorScreen';
import { usePublishReview } from './hooks/usePublishReview';
import { useReachEstimate } from './hooks/useReachEstimate';
import { useTargetAreas } from './hooks/useTargetAreas';
import { useToast } from './hooks/useToast';
import { useVerifiedReports } from './hooks/useVerifiedReports';
import { editorLabel, useWarningEditor } from './hooks/useWarningEditor';
import { useWarningForm } from './hooks/useWarningForm';
import { useWarningSubmit } from './hooks/useWarningSubmit';
import { useWarnings } from './hooks/useWarnings';
import {
  WORKFLOW_STEPS,
  useWorkflowNavigation,
} from './hooks/useWorkflowNavigation';
import { CancelDialog } from './components/CancelDialog';
import { ErrorNotice } from './components/ErrorNotice';
import { PublishDialog } from './components/PublishDialog';
import { Toast } from './components/shell/Toast';
import { UseCaseNote } from './components/shell/UseCaseNote';
import { WorkflowSteps } from './components/shell/WorkflowSteps';
import { AreaStep } from './components/steps/AreaStep';
import { DeliveryStep } from './components/steps/DeliveryStep';
import { LevelStep } from './components/steps/LevelStep';
import { MonitorStep } from './components/steps/MonitorStep';
import { ReviewStep } from './components/steps/ReviewStep';
import { StepLoading } from './components/steps/StepLoading';

// WarningWorkflow is the UC1 screen (design: #/portal/warnings): five steps from
// hazard monitoring to delivery status.
// SRP: it only composes. Each step's state and logic live in their own hook
// (useMonitorScreen, useLevelScreen, useWarningSubmit, useDeliveryScreen, ...), and
// the steps themselves are presentational components.
// So a change to one step is made in that step's hook or component, and this file
// only decides which screen to show and passes data down.
export function WarningWorkflow() {
  const nav = useWorkflowNavigation();
  const warnings = useWarnings();
  const reports = useVerifiedReports();
  const areas = useTargetAreas();
  const form = useWarningForm();
  const toast = useToast();

  const reportList = useMemo(() => reports.data ?? [], [reports.data]);
  const warningList = useMemo(() => warnings.data ?? [], [warnings.data]);
  const areaList = useMemo(() => areas.data ?? [], [areas.data]);
  const areaNames = useMemo(
    () => Object.fromEntries(areaList.map((area) => [area.id, area.name])),
    [areaList],
  );

  const { step, editor: currentEditor } = nav.state;
  const updatingId =
    currentEditor?.mode === 'update' ? currentEditor.warningId : null;

  const editor = useWarningEditor({
    nav,
    form,
    reports: reportList,
    areas: areaList,
  });
  const monitor = useMonitorScreen({
    reports: reportList,
    warnings: warningList,
    areas: areaList,
  });
  const review = useMemo(
    () =>
      buildReviewView(nav.state.reportId, {
        reports: reportList,
        warnings: warningList,
        areaNames,
      }),
    [nav.state.reportId, reportList, warningList, areaNames],
  );
  const level = useLevelScreen({
    sourceReportId: form.values.sourceReportId,
    reports: reportList,
    warnings: warningList,
    areas: areaList,
  });

  // Step 4: reach of the selected areas, saving, and the publish review.
  const areaReach = useReachEstimate(form.values.areaIds);
  const submit = useWarningSubmit({
    editor: currentEditor,
    values: form.values,
    setErrors: form.setErrors,
    openDelivery: nav.openDelivery,
    toMonitor: nav.toMonitor,
    afterChange: warnings.reload,
    notify: toast.show,
    onDraftSaved: () => monitor.setTab('DRAFT'),
  });
  const publishReview = usePublishReview(submit);

  const delivery = useDeliveryScreen({
    warningId: step === 'delivery' ? nav.state.warningId : null,
    warnings: warningList,
    areas: areaList,
    onCancelled: warnings.reload,
    notify: toast.show,
  });

  // The current step's screen; a loading state until its data has arrived.
  const renderStep = () => {
    if (step === 'monitor') {
      return (
        <MonitorStep
          screen={monitor}
          areaNames={areaNames}
          updatedAt={warnings.updatedAt}
          onReview={nav.openReview}
          onOpenWarning={editor.openWarning}
          onCreate={() => editor.createFrom(null)}
        />
      );
    }
    if (step === 'review' && review) {
      return (
        <ReviewStep
          view={review}
          areaNames={areaNames}
          updatedAt={warnings.updatedAt}
          onBack={nav.toMonitor}
          onOpenWarning={editor.openWarning}
          onProceed={editor.createFrom}
        />
      );
    }
    if (step === 'level') {
      return (
        <LevelStep
          values={form.values}
          errors={form.errors}
          reports={reportList}
          report={level.sourceReport}
          factors={level.factors}
          smsReach={level.smsReach}
          editorLabel={editorLabel(currentEditor)}
          sourceLocked={updatingId !== null}
          updatedAt={reports.updatedAt}
          onSourceChange={editor.chooseSource}
          onFieldChange={form.setField}
          onBack={editor.backFromLevel}
          onContinue={editor.continueToArea}
        />
      );
    }
    if (step === 'area') {
      return (
        <AreaStep
          values={form.values}
          errors={form.errors}
          areas={areaList}
          report={level.sourceReport}
          reach={areaReach.data}
          editorLabel={editorLabel(currentEditor)}
          isUpdate={updatingId !== null}
          failure={submit.failure}
          busy={submit.pending !== null}
          updatedAt={areas.updatedAt}
          onFieldChange={form.setField}
          actions={{
            onBack: () => nav.goTo('level'),
            onSaveDraft: () => void submit.saveDraft(),
            onReview: publishReview.start,
          }}
        />
      );
    }
    if (step === 'delivery' && delivery.view) {
      const { view, actions } = delivery;
      return (
        <DeliveryStep
          view={view}
          loading={delivery.deliveries.loading}
          retryError={actions.retryError}
          busy={actions.pending !== null}
          updatedAt={delivery.deliveries.updatedAt}
          onBack={nav.toMonitor}
          onRetry={(recordId) => void actions.retry(recordId)}
          onRetryAll={(records) => void actions.retryAll(records)}
          onUpdate={() => editor.startUpdate(view.warning)}
          onCancel={delivery.openCancel}
        />
      );
    }
    const title = WORKFLOW_STEPS.find(({ key }) => key === step)?.label ?? '';
    return <StepLoading title={title} onBack={nav.toMonitor} />;
  };

  const { hazard, severity } = form.values;
  const cancelTarget = delivery.warning;

  return (
    <div className="flex flex-col gap-4 text-[#17212B]">
      <UseCaseNote />
      <WorkflowSteps steps={nav.steps} onOpen={nav.goTo} />
      <ErrorNotice error={warnings.error} onRetry={warnings.reload} />
      <ErrorNotice error={reports.error} onRetry={reports.reload} />
      <ErrorNotice error={areas.error} onRetry={areas.reload} />

      {renderStep()}

      {publishReview.open && hazard && severity && (
        <PublishDialog
          {...publishReviewText(form.values, {
            updatingId,
            areaNames,
            reach: areaReach.data,
          })}
          severity={severity}
          hazard={hazard}
          pending={submit.pending !== null}
          onConfirm={() => void publishReview.confirm()}
          onSaveDraft={publishReview.saveDraft}
          onClose={publishReview.close}
        />
      )}
      {delivery.cancelling && cancelTarget && (
        <CancelDialog
          title={`Cancel warning ${shortId('W', cancelTarget.id)}?`}
          description={cancelDescription(
            cancelTarget,
            areaNames,
            resolveDistricts(cancelTarget.areaIds, areaList),
          )}
          pending={delivery.actions.pending === 'cancel'}
          error={delivery.actions.cancelError}
          onConfirm={(reason) =>
            void delivery.actions.cancel(cancelTarget.id, reason)
          }
          onClose={delivery.closeCancel}
        />
      )}
      <Toast message={toast.message} onDismiss={toast.dismiss} />
    </div>
  );
}
