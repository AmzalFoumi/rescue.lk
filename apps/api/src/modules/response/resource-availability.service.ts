import { Inject, Injectable } from '@nestjs/common';
import type { RescueTeamRecord } from './rescue-team.js';
import { RESCUE_TEAMS_REPOSITORY } from './rescue-teams.repository.interface.js';
import type {
  RescueTeamsRepository,
  TeamFilter,
} from './rescue-teams.repository.interface.js';
import { SHELTERS_REPOSITORY } from './shelters.repository.interface.js';
import type { SheltersRepository } from './shelters.repository.interface.js';
import { toShelterView } from './shelter.js';
import type { ShelterView } from './shelter.js';
import { TeamStatus } from './team-status.js';

export interface TeamAvailability {
  teams: RescueTeamRecord[];
  /** Zero is extension 5.a: no team is available, so no dispatch is made. */
  availableCount: number;
}

/**
 * Check Resource Availability, the use case included by Dispatch Rescue Team,
 * Assign Shelter and Allocate Relief Resources. It answers "what is there, and
 * who owns it" for every organisation at once.
 */
@Injectable()
export class ResourceAvailabilityService {
  constructor(
    @Inject(RESCUE_TEAMS_REPOSITORY)
    private readonly teams: RescueTeamsRepository,
    @Inject(SHELTERS_REPOSITORY)
    private readonly shelters: SheltersRepository,
  ) {}

  /**
   * Teams from every organisation in one list, with their owner, status and
   * location. The officer sees unavailable teams too, so the list explains
   * itself when nothing can be dispatched.
   */
  async listTeams(filter: TeamFilter = {}): Promise<TeamAvailability> {
    const teams = await this.teams.findAll(filter);
    return {
      teams,
      availableCount: teams.filter(
        (team) => team.status === TeamStatus.Available,
      ).length,
    };
  }

  /** Shelters with their status and free places worked out from the numbers. */
  async listShelters(district?: string): Promise<ShelterView[]> {
    const shelters = await this.shelters.findAll(district);
    return shelters.map(toShelterView);
  }
}
