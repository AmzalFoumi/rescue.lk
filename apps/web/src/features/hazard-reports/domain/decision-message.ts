import { formatTime } from './format';
import { shortReportId } from './report-id';

/** The line shown after an operator decides, like "R-8E36 verified by K. Jayawardena at 10:42." */
export function describeDecision(
  decision: 'verified' | 'rejected',
  reportId: string,
  operatorName: string,
  at: Date,
  timeZone?: string,
): string {
  return `${shortReportId(reportId)} ${decision} by ${operatorName} at ${formatTime(at, timeZone)}.`;
}
