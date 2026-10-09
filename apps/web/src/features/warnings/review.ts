import type { VerifiedHazardReportDto, WarningDto } from '@rescue-lk/shared';
import { currentWarningFor, linkedWarnings } from './monitoring';
import { reportTimeline, sameDayReports, type TimelineEvent } from './timeline';

export interface ReviewView {
  report: VerifiedHazardReportDto;
  // The report's newest warning that is not cancelled, if any.
  current: WarningDto | undefined;
  linked: readonly WarningDto[];
  sameDay: readonly VerifiedHazardReportDto[];
  timeline: readonly TimelineEvent[];
}

interface ReviewData {
  reports: readonly VerifiedHazardReportDto[];
  warnings: readonly WarningDto[];
  areaNames: Record<string, string>;
}

// buildReviewView gathers everything step 2 shows about one report: its current and
// linked warnings, same-day reports and the incident timeline.
// SRP: a pure function, tested without rendering. It returns null until the report
// is loaded, so the step shows a loading state instead of crashing.
export const buildReviewView = (
  reportId: string | null,
  { reports, warnings, areaNames }: ReviewData,
): ReviewView | null => {
  const report = reports.find((candidate) => candidate.id === reportId);
  if (!report) {
    return null;
  }
  const linked = linkedWarnings(report.id, warnings);
  return {
    report,
    current: currentWarningFor(report.id, warnings),
    linked,
    sameDay: sameDayReports(report, reports),
    timeline: reportTimeline(report, linked, areaNames),
  };
};
