import type { IssueWarningCommand } from '../domain/issue-warning.command.js';
import type { HazardReportSummary } from '../hazard-report-lookup/hazard-report-lookup.interface.js';
import {
  MAX_WARNING_DURATION_HOURS,
  MILLISECONDS_PER_HOUR,
} from '../warnings.constants.js';

// Parameter object passed to the validator and to every rule. `now` is supplied
// by the caller so the rules stay pure and deterministic in tests.
export interface WarningValidationContext {
  command: IssueWarningCommand;
  report: HazardReportSummary;
  now: Date;
}

// A rule returns a violation message, or null when the warning satisfies it.
// New rules are added to WARNING_RULES without changing the validator (OCP).
export type WarningRule = (context: WarningValidationContext) => string | null;

const MAX_WARNING_DURATION_MS =
  MAX_WARNING_DURATION_HOURS * MILLISECONDS_PER_HOUR;

const expiresInFuture: WarningRule = ({ command, now }) =>
  command.expiresAt.getTime() > now.getTime()
    ? null
    : 'expiresAt must be in the future';

const expiresWithinMaxDuration: WarningRule = ({ command, now }) =>
  command.expiresAt.getTime() - now.getTime() <= MAX_WARNING_DURATION_MS
    ? null
    : `expiresAt must be no more than ${MAX_WARNING_DURATION_HOURS} hours from now`;

const coversReportDistrict: WarningRule = ({ command, report }) =>
  command.districts.includes(report.district)
    ? null
    : `districts must include the hazard report's district ${report.district}`;

export const WARNING_RULES: readonly WarningRule[] = [
  expiresInFuture,
  expiresWithinMaxDuration,
  coversReportDistrict,
];
