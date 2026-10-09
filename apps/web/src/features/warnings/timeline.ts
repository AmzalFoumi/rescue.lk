import type { VerifiedHazardReportDto, WarningDto } from '@rescue-lk/shared';
import { areaSummary, shortId } from './format';
import { SEVERITY_META } from './meta';

// timeline.ts builds the incident timeline (step 2) and the warning events used by the
// audit timeline (step 5) from plain data.
// SRP: pure functions, tested without rendering; the Timeline component only displays
// the events.

// Events shown in the incident and audit timelines. The kind picks the icon.
export type TimelineKind =
  | 'reported'
  | 'verified'
  | 'created'
  | 'published'
  | 'updated'
  | 'cancelled'
  | 'sent'
  | 'failed';

export interface TimelineEvent {
  at: string;
  kind: TimelineKind;
  text: string;
}

// Reports within this window of each other count as "the same day".
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const newestFirst = (events: readonly TimelineEvent[]) =>
  [...events].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

// What happened to a warning: created, published, updated, cancelled.
export const warningEvents = (
  warning: WarningDto,
  areaNames: Record<string, string>,
): TimelineEvent[] => {
  const id = shortId('W', warning.id);
  const events: TimelineEvent[] = [
    {
      at: warning.createdAt,
      kind: 'created',
      text: `${id} created by ${warning.createdBy}.`,
    },
  ];
  if (warning.publishedAt) {
    events.push({
      at: warning.publishedAt,
      kind: 'published',
      text: `${id} published as ${SEVERITY_META[warning.severity].label} for ${areaSummary(warning.areaIds, areaNames)}.`,
    });
  }
  // Saving a draft also sets updatedAt; only a published change is an update.
  if (warning.updatedAt && warning.status !== 'DRAFT') {
    events.push({
      at: warning.updatedAt,
      kind: 'updated',
      text: `${id} updated to version ${warning.version}.`,
    });
  }
  if (warning.cancelledAt) {
    events.push({
      at: warning.cancelledAt,
      kind: 'cancelled',
      text: `${id} cancelled: ${warning.cancelReason}`,
    });
  }
  return events;
};

// Step 2 incident timeline: the report, its verification and its warnings.
export const reportTimeline = (
  report: VerifiedHazardReportDto,
  warnings: readonly WarningDto[],
  areaNames: Record<string, string>,
): TimelineEvent[] =>
  newestFirst([
    {
      at: report.submittedAt,
      kind: 'reported',
      text: `Reported by ${report.reporter} through the rescue.lk app.`,
    },
    {
      at: report.verifiedAt,
      kind: 'verified',
      text: `Verified by ${report.verifiedBy}.`,
    },
    ...warnings.flatMap((warning) => warningEvents(warning, areaNames)),
  ]);

// Other verified reports from the same district, submitted within a day.
export const sameDayReports = (
  report: VerifiedHazardReportDto,
  reports: readonly VerifiedHazardReportDto[],
): VerifiedHazardReportDto[] =>
  reports.filter(
    (other) =>
      other.id !== report.id &&
      other.districtName === report.districtName &&
      Math.abs(Date.parse(other.submittedAt) - Date.parse(report.submittedAt)) <
        ONE_DAY_MS,
  );
