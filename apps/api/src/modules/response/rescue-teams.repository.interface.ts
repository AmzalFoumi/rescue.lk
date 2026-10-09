import type { ActiveDispatch, RescueTeamRecord } from './rescue-team.js';
import type { TeamStatus } from './team-status.js';

export const RESCUE_TEAMS_REPOSITORY = Symbol('RESCUE_TEAMS_REPOSITORY');

export interface TeamFilter {
  /** District id. */
  district?: string;
  status?: TeamStatus;
}

export interface RescueTeamsRepository {
  /** Every team, from every organisation, newest status first in no order. */
  findAll(filter: TeamFilter): Promise<RescueTeamRecord[]>;
  findById(id: string): Promise<RescueTeamRecord | null>;
  /**
   * Sets the team to Dispatched only if it is still Available. Returns null
   * when another officer took it first, which is extension 7.a.
   */
  dispatch(
    id: string,
    assignment: ActiveDispatch,
  ): Promise<RescueTeamRecord | null>;
  /** Changes the status and clears the assignment when the team is free again. */
  changeStatus(
    id: string,
    status: TeamStatus,
    clearAssignment: boolean,
  ): Promise<RescueTeamRecord | null>;
}
