import Link from 'next/link';
import { DUPLICATE_NOTICE } from '../domain/report-card';
import { shortReportId } from '../domain/report-id';
import type { SubmitOutcome } from '../hooks/use-submit-report';
import { Button } from './Button';
import { StatusChip } from './StatusChip';
import { TONE_CLASSES } from './tone-classes';

interface SubmitResultProps {
  outcome: SubmitOutcome;
  onNewReport: () => void;
}

/** What the reporter sees after pressing the send button. */
export function SubmitResult({ outcome, onNewReport }: SubmitResultProps) {
  const sent = outcome.kind === 'sent';

  return (
    <div className="space-y-4 text-center">
      <h2 className="text-2xl font-bold">
        {sent ? 'Report sent' : 'Saved on this phone'}
      </h2>
      <div className="flex justify-center">
        <StatusChip
          status={sent ? outcome.report.status : 'pending_synchronisation'}
        />
      </div>
      <p className="text-ink-muted">
        {sent
          ? `${shortReportId(outcome.report.id)} has been received by the Disaster Management Centre. Follow its status in My Reports.`
          : 'Your report will be sent automatically when you are back online. You do not need to submit it again.'}
      </p>
      {sent && outcome.report.possibleDuplicateOf.length > 0 && (
        <p
          role="status"
          className={`rounded-[10px] border p-3 text-left ${TONE_CLASSES.caution}`}
        >
          {DUPLICATE_NOTICE}
        </p>
      )}
      <div className="flex flex-col gap-3">
        <Link
          href="/hazard-reports/mine"
          className="inline-flex min-h-12 items-center justify-center rounded-[10px] bg-primary px-5 font-semibold text-white hover:bg-primary-hover"
        >
          View my reports
        </Link>
        <Button variant="outline" onClick={onNewReport}>
          Report another hazard
        </Button>
      </div>
    </div>
  );
}
