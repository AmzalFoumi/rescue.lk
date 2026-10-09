import type { Location } from './location.js';
import type { Owner } from './organisation.js';
import type { TeamStatus } from './team-status.js';

/** The report a team is currently working on. */
export interface ActiveDispatch {
  reportId: string;
  dispatchedBy: string;
  dispatchedAt: Date;
}

/**
 * A rescue team, as the services see it. A plain type: it does not know about
 * MongoDB. Only the Mongoose repository turns documents into this shape.
 */
export interface RescueTeamRecord {
  id: string;
  name: string;
  owner: Owner;
  status: TeamStatus;
  /** District id. */
  district: string;
  location: Location;
  /** Set only while the team is Dispatched. */
  activeDispatch?: ActiveDispatch;
}
