import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { isObjectId } from './object-id.js';
import type { RescueTeamRecord } from './rescue-team.js';
import { RESCUE_TEAMS_REPOSITORY } from './rescue-teams.repository.interface.js';
import type { RescueTeamsRepository } from './rescue-teams.repository.interface.js';
import {
  TeamStatus,
  canChangeTeamStatus,
  endsAssignment,
} from './team-status.js';

/**
 * Update Team Status: a rescue team records where it is up to, so the officer
 * sees the real state of every team before dispatching.
 */
@Injectable()
export class TeamStatusService {
  private readonly logger = new Logger(TeamStatusService.name);

  constructor(
    @Inject(RESCUE_TEAMS_REPOSITORY)
    private readonly teams: RescueTeamsRepository,
  ) {}

  async getById(id: string): Promise<RescueTeamRecord> {
    const team = isObjectId(id) ? await this.teams.findById(id) : null;
    if (!team) {
      throw new NotFoundException(`Rescue team ${id} not found`);
    }
    return team;
  }

  async changeStatus(
    id: string,
    status: TeamStatus,
  ): Promise<RescueTeamRecord> {
    const team = await this.getById(id);
    if (!canChangeTeamStatus(team.status, status)) {
      throw new ConflictException(
        status === TeamStatus.Dispatched
          ? 'A team is only dispatched through Dispatch Rescue Team'
          : `A ${team.status} team cannot become ${status}`,
      );
    }
    const updated = await this.teams.changeStatus(
      id,
      status,
      endsAssignment(status),
    );
    // The team was found a moment ago, so null here means it was deleted.
    if (!updated) {
      throw new NotFoundException(`Rescue team ${id} not found`);
    }
    this.logger.log(`Team ${id} is now ${status}`);
    return updated;
  }
}
