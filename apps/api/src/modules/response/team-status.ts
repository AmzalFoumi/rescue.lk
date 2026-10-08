export enum TeamStatus {
  Available = 'available',
  Dispatched = 'dispatched',
  Returning = 'returning',
  Unavailable = 'unavailable',
}

/**
 * The status changes a Rescue Team Member may make by hand (Update Team
 * Status). Becoming Dispatched is deliberately absent: a team may only be
 * dispatched through Dispatch Rescue Team, so that every dispatch has a
 * report, an officer and a dispatch record behind it.
 */
const ALLOWED_CHANGES: Record<TeamStatus, TeamStatus[]> = {
  [TeamStatus.Available]: [TeamStatus.Unavailable],
  [TeamStatus.Dispatched]: [TeamStatus.Returning, TeamStatus.Unavailable],
  [TeamStatus.Returning]: [TeamStatus.Available, TeamStatus.Unavailable],
  [TeamStatus.Unavailable]: [TeamStatus.Available],
};

/** True when a team may move from one status to the other by hand. */
export function canChangeTeamStatus(from: TeamStatus, to: TeamStatus): boolean {
  return ALLOWED_CHANGES[from].includes(to);
}

/** A team that leaves Dispatched is no longer assigned to its report. */
export function endsAssignment(to: TeamStatus): boolean {
  return to !== TeamStatus.Dispatched;
}
