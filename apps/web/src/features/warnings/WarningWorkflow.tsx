'use client';

import { useMemo, useState } from 'react';
import { buildDeliveryView } from './delivery';
import { hazardFactors } from './factors';
import { areaSummary, hazardName, shortId } from './format';
import { districtAreaId, resolveDistricts } from './monitoring';
import { publishSummary } from './publishing';
import { buildReviewView } from './review';
import { useDeliveries } from './hooks/useDeliveries';
import { useDeliveryActions } from './hooks/useDeliveryActions';
import { useMonitorScreen } from './hooks/useMonitorScreen';
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
import { AreaStep } from './components/steps/AreaStep';
import { DeliveryStep } from './components/steps/DeliveryStep';
import { UseCaseNote } from './components/shell/UseCaseNote';
import { WorkflowSteps } from './components/shell/WorkflowSteps';
import { LevelStep } from './components/steps/LevelStep';
import { MonitorStep } from './components/steps/MonitorStep';
import { ReviewStep } from './components/steps/ReviewStep';
import { StepLoading } from './components/steps/StepLoading';

// UC1 screen (design: #/portal/warnings): a five-step workflow from hazard
// monitoring to delivery status. Hooks hold the state; components render.
export function WarningWorkflow() {
  const nav = useWorkflowNavigation();
  const warnings = useWarnings();
  const reports = useVerifiedReports();
  const areas = useTargetAreas();
  const form = useWarningForm();

  const reportList = useMemo(() => reports.data ?? [], [reports.data]);
  const warningList = useMemo(() => warnings.data ?? [], [warnings.data]);
  const areaList = useMemo(() => areas.data ?? [], [areas.data]);
  const areaNames = useMemo(
    () => Object.fromEntries(areaList.map((area) => [area.id, area.name])),
    [areaList],
  );

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

  // The source report chosen in the editor, and what is known about it.
  const sourceReport = reportList.find(
    (report) => report.id === form.values.sourceReportId,
  );
  const factors = useMemo(
    () =>
      sourceReport
        ? hazardFactors(sourceReport, {
            reports: reportList,
            warnings: warningList,
            areas: areaList,
          })
        : null,
    [sourceReport, reportList, warningList, areaList],
  );
  const sourceAreaId =
    sourceReport && districtAreaId(sourceReport.districtName, areaList);
  const districtReach = useReachEstimate(sourceAreaId ? [sourceAreaId] : []);
  const smsReach =
    districtReach.data?.channels.find((reach) => reach.channel === 'SMS')
      ?.recipients ?? null;

  // Step 4: reach of the selected areas, and saving or publishing.
  const areaReach = useReachEstimate(form.values.areaIds);
  const toast = useToast();
  const [reviewing, setReviewing] = useState(false);
  const { editor: currentEditor } = nav.state;
  const isUpdate = currentEditor?.mode === 'update';
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

  const confirmPublish = async () => {
    await submit.confirm();
    // On failure the field errors are shown on step 4, as in the design.
    setReviewing(false);
  };

  const saveDraftFromReview = () => {
    setReviewing(false);
    void submit.saveDraft();
  };

  // Step 5: the warning's latest deliveries (polled while in progress),
  // retries and cancelling.
  const deliveryWarningId =
    nav.state.step === 'delivery' ? nav.state.warningId : null;
  const deliveries = useDeliveries(deliveryWarningId);
  const deliveryWarning = warningList.find(
    (warning) => warning.id === deliveryWarningId,
  );
  const deliveryReach = useReachEstimate(deliveryWarning?.areaIds ?? []);
  const deliveryView = useMemo(
    () =>
      buildDeliveryView(deliveryWarningId, {
        warnings: warningList,
        records: deliveries.data ?? [],
        reach: deliveryReach.data,
        areas: areaList,
      }),
    [
      deliveryWarningId,
      warningList,
      deliveries.data,
      deliveryReach.data,
      areaList,
    ],
  );
  const [cancelling, setCancelling] = useState(false);
  const deliveryActions = useDeliveryActions({
    afterRetry: deliveries.reload,
    afterCancel: () => {
      setCancelling(false);
      warnings.reload();
    },
    notify: toast.show,
  });

  const stepLabel =
    WORKFLOW_STEPS.find((step) => step.key === nav.state.step)?.label ?? '';

  // The current step's screen. Steps not built yet show a placeholder.
  const renderStep = () => {
    const { step } = nav.state;
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
          report={sourceReport}
          factors={factors}
          smsReach={smsReach}
          editorLabel={editorLabel(nav.state.editor)}
          sourceLocked={nav.state.editor?.mode === 'update'}
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
          report={sourceReport}
          reach={areaReach.data}
          editorLabel={editorLabel(currentEditor)}
          canSaveDraft={!isUpdate}
          isUpdate={isUpdate}
          failure={submit.failure}
          busy={submit.pending !== null}
          updatedAt={areas.updatedAt}
          onFieldChange={form.setField}
          onBack={() => nav.goTo('level')}
          onSaveDraft={() => void submit.saveDraft()}
          onReview={() => {
            submit.clearFailure();
            setReviewing(true);
          }}
        />
      );
    }
    if (step === 'delivery' && deliveryView) {
      return (
        <DeliveryStep
          view={deliveryView}
          loading={deliveries.loading}
          retryError={deliveryActions.retryError}
          busy={deliveryActions.pending !== null}
          updatedAt={deliveries.updatedAt}
          onBack={nav.toMonitor}
          onRetry={(recordId) => void deliveryActions.retry(recordId)}
          onRetryAll={(records) => void deliveryActions.retryAll(records)}
          onUpdate={() => editor.startUpdate(deliveryView.warning)}
          onCancel={() => {
            deliveryActions.clearFailure();
            setCancelling(true);
          }}
        />
      );
    }
    return <StepLoading title={stepLabel} onBack={nav.toMonitor} />;
  };

  const { hazard, severity } = form.values;

  return (
    <div className="flex flex-col gap-4 text-[#17212B]">
      <UseCaseNote />
      <WorkflowSteps steps={nav.steps} onOpen={nav.goTo} />
      <ErrorNotice error={warnings.error} onRetry={warnings.reload} />
      <ErrorNotice error={reports.error} onRetry={reports.reload} />
      <ErrorNotice error={areas.error} onRetry={areas.reload} />

      {renderStep()}

      {reviewing && hazard && severity && (
        <PublishDialog
          title={
            isUpdate && currentEditor
              ? `Send update to ${shortId('W', currentEditor.warningId)}?`
              : 'Publish this warning?'
          }
          severity={severity}
          hazard={hazard}
          hazardLabel={hazardName({
            hazard,
            otherHazard: form.values.otherHazard,
          })}
          summary={publishSummary(form.values, {
            areaNames,
            reach: areaReach.data,
          })}
          canSaveDraft={!isUpdate}
          confirmLabel={
            isUpdate ? 'Confirm and send update' : 'Confirm and publish'
          }
          pending={submit.pending !== null}
          onConfirm={() => void confirmPublish()}
          onSaveDraft={saveDraftFromReview}
          onClose={() => setReviewing(false)}
        />
      )}
      {cancelling && deliveryWarning && (
        <CancelDialog
          title={`Cancel warning ${shortId('W', deliveryWarning.id)}?`}
          description={`${hazardName(deliveryWarning)} warning for ${areaSummary(deliveryWarning.areaIds, areaNames)}. It will be removed from the Citizen App for ${resolveDistricts(deliveryWarning.areaIds, areaList).join(', ')}. This cannot be undone.`}
          pending={deliveryActions.pending === 'cancel'}
          error={deliveryActions.cancelError}
          onConfirm={(reason) =>
            void deliveryActions.cancel(deliveryWarning.id, reason)
          }
          onClose={() => setCancelling(false)}
        />
      )}
      <Toast message={toast.message} onDismiss={toast.dismiss} />
    </div>
  );
}
