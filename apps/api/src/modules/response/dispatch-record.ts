import type { Owner } from './organisation.js';

/**
 * One dispatch of one team to one report. The rescue team holds the current
 * state; this is the history behind it, used to confirm the dispatch (step 8)
 * and to follow progress later.
 */
export interface DispatchRecord {
  id: string;
  reportId: string;
  teamId: string;
  teamName: string;
  owner: Owner;
  /** District id of the team at the time of dispatch. */
  district: string;
  dispatchedBy: string;
  dispatchedAt: Date;
}
