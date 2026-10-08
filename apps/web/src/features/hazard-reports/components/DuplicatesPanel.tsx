import type { HazardReportDto } from '@rescue-lk/shared';
import { formatDateTime } from '../domain/format';
import { shortReportId } from '../domain/report-id';
import type { AsyncData } from '../hooks/use-async-data';
import { Button } from './Button';
import { StateMessage } from './StateMessage';
import { StatusChip } from './StatusChip';
import { CARD_CLASS, TONE_CLASSES } from './tone-classes';

interface DuplicatesPanelProps {
  /** The ids the server flagged as possible duplicates of this report. */
  duplicateIds: readonly string[];
  /** The reports behind those ids, loaded one by one. */
  duplicates: AsyncData<HazardReportDto[]>;
  /** True when that report is in the operator's queue, so it can be opened. */
  canOpen: (id: string) => boolean;
  onOpen: (id: string) => void;
}

/** Shows the earlier reports that look like the same event (scenario 8.a, seen by the operator). */
export function DuplicatesPanel({
  duplicateIds,
  duplicates,
  canOpen,
  onOpen,
}: DuplicatesPanelProps) {
  let content;
  if (duplicateIds.length === 0) {
    content = <p className="text-ink-muted">No possible duplicates found.</p>;
  } else if (duplicates.loading) {
    content = <StateMessage kind="loading" />;
  } else if (duplicates.error) {
    content = (
      <StateMessage
        kind="error"
        message={duplicates.error}
        onRetry={duplicates.reload}
      />
    );
  } else {
    content = (
      <>
        <p className={`rounded-[10px] border p-3 ${TONE_CLASSES.caution}`}>
          <strong>
            {duplicateIds.length === 1
              ? '1 possible duplicate found'
              : `${duplicateIds.length} possible duplicates found`}
          </strong>
          <br />
          Checked reports of the same hazard within 1 km and 24 hours.
        </p>
        <ul className="space-y-2">
          {(duplicates.data ?? []).map((duplicate) => (
            <li
              key={duplicate.id}
              className="space-y-1 rounded-[10px] border border-line p-3"
            >
              <p className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-bold">
                  {shortReportId(duplicate.id)}
                </span>
                <StatusChip status={duplicate.status} />
              </p>
              <p className="text-sm text-ink-muted">
                {formatDateTime(duplicate.capturedAt)} ·{' '}
                {duplicate.reporterName ?? duplicate.reporterId}
              </p>
              <p>{duplicate.description}</p>
              {canOpen(duplicate.id) && (
                <Button variant="outline" onClick={() => onOpen(duplicate.id)}>
                  Open {shortReportId(duplicate.id)}
                </Button>
              )}
            </li>
          ))}
        </ul>
      </>
    );
  }

  return (
    <section className={`${CARD_CLASS} space-y-3`}>
      <h3 className="font-semibold">Check for duplicates</h3>
      {content}
    </section>
  );
}
