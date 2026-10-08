'use client';

import { useState } from 'react';
import type { DistrictDto } from '@rescue-lk/shared';
import { Button } from '../components/Button';
import { DetailsStep } from '../components/DetailsStep';
import { ErrorSummary } from '../components/ErrorSummary';
import { HazardTypeStep } from '../components/HazardTypeStep';
import { PhotoStep } from '../components/PhotoStep';
import { ReviewStep } from '../components/ReviewStep';
import { StateMessage } from '../components/StateMessage';
import { SubmitResult } from '../components/SubmitResult';
import { WizardProgress } from '../components/WizardProgress';
import { buildSubmission } from '../domain/build-submission';
import { STEP_TITLES, firstInvalidStep } from '../domain/report-draft';
import { buildReviewRows } from '../domain/review-rows';
import { useAsyncAction } from '../hooks/use-async-action';
import { useDistricts } from '../hooks/use-report-data';
import { useReportWizard } from '../hooks/use-report-wizard';
import {
  useSubmitReport,
  type SubmitOutcome,
} from '../hooks/use-submit-report';
import { useReporting } from '../state/reporting-context';
import { CitizenFrame } from './CitizenFrame';

/** The 4-step report form. Waits for the districts, then shows the wizard. */
export function NewReportScreen() {
  const { reporter } = useReporting();
  const districts = useDistricts();
  const homeDistrict = districts.data?.find(
    (district) => district.name === reporter.districtName,
  );

  let content;
  if (districts.loading) {
    content = <StateMessage kind="loading" />;
  } else if (districts.error || !districts.data) {
    content = (
      <StateMessage
        kind="error"
        message={districts.error ?? undefined}
        onRetry={districts.reload}
      />
    );
  } else if (!homeDistrict) {
    content = (
      <StateMessage
        kind="error"
        message={`The district ${reporter.districtName} was not found. Run the district seed.`}
      />
    );
  } else {
    content = (
      <ReportWizard districts={districts.data} homeDistrict={homeDistrict} />
    );
  }

  return <CitizenFrame>{content}</CitizenFrame>;
}

function ReportWizard({
  districts,
  homeDistrict,
}: {
  districts: DistrictDto[];
  homeDistrict: DistrictDto;
}) {
  const { reporter, online } = useReporting();
  const wizard = useReportWizard();
  const { step, draft, errors } = wizard.state;
  const sendReport = useSubmitReport();
  const [outcome, setOutcome] = useState<SubmitOutcome | null>(null);
  // Shown on the review screen. The real time is taken when the report is sent.
  const [openedAt] = useState(() => new Date());

  const submit = useAsyncAction(() =>
    sendReport(
      buildSubmission(draft, {
        reporter,
        homeDistrict,
        districts,
        now: new Date(),
      }),
    ),
  );

  const handleSubmit = async () => {
    if (firstInvalidStep(draft) !== null) {
      wizard.checkAll();
      return;
    }
    const result = await submit.run();
    if (result) setOutcome(result);
  };

  if (outcome) {
    return (
      <SubmitResult
        outcome={outcome}
        onNewReport={() => {
          setOutcome(null);
          wizard.reset();
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <WizardProgress step={step} />
      <h1 className="text-xl font-bold">{STEP_TITLES[step]}</h1>
      <ErrorSummary errors={errors} />
      {step === 1 && (
        <HazardTypeStep
          hazardType={draft.hazardType}
          otherHazard={draft.otherHazard}
          errors={errors}
          onChange={wizard.change}
        />
      )}
      {step === 2 && (
        <DetailsStep
          draft={draft}
          districts={districts}
          errors={errors}
          onChange={wizard.change}
        />
      )}
      {step === 3 && (
        <PhotoStep
          photo={draft.photo}
          onChange={(photo) => wizard.change({ photo })}
        />
      )}
      {step === 4 && (
        <ReviewStep
          rows={buildReviewRows(draft, districts, openedAt)}
          online={online}
          submitting={submit.pending}
          error={submit.error}
          onEdit={wizard.goTo}
          onSubmit={handleSubmit}
        />
      )}
      <div className="flex gap-3">
        {step > 1 && (
          <Button variant="outline" onClick={wizard.back}>
            Back
          </Button>
        )}
        {step < 4 && (
          <Button className="flex-1" onClick={wizard.next}>
            {step === 3 && !draft.photo ? 'Skip and continue' : 'Continue'}
          </Button>
        )}
      </div>
    </div>
  );
}
