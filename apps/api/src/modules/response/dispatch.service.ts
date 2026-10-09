import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { DispatchRecord } from './dispatch-record.js';
import { DISPATCHES_REPOSITORY } from './dispatches.repository.interface.js';
import type { DispatchesRepository } from './dispatches.repository.interface.js';
import { isObjectId } from './object-id.js';
import type { RescueTeamRecord } from './rescue-team.js';
import { RESCUE_TEAMS_REPOSITORY } from './rescue-teams.repository.interface.js';
import type { RescueTeamsRepository } from './rescue-teams.repository.interface.js';
import { TeamStatus } from './team-status.js';
import { VERIFIED_REPORTS } from './verified-reports.port.js';
import type { VerifiedReportsPort } from './verified-reports.port.js';

/** What the officer gets back once a team is on its way (step 8). */
export interface DispatchConfirmation {
  dispatch: DispatchRecord;
  team: RescueTeamRecord;
}

/** The "Dispatch Rescue Team" sequence diagram. */
@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name);

  constructor(
    @Inject(RESCUE_TEAMS_REPOSITORY)
    private readonly teams: RescueTeamsRepository,
    @Inject(DISPATCHES_REPOSITORY)
    private readonly dispatches: DispatchesRepository,
    @Inject(VERIFIED_REPORTS)
    private readonly verifiedReports: VerifiedReportsPort,
  ) {}

  /**
   * Steps 6 to 8: the officer picks a team, the system checks it is still
   * available and sets it to Dispatched, then confirms.
   */
  async dispatch(
    reportId: string,
    teamId: string,
    officerId: string,
  ): Promise<DispatchConfirmation> {
    const report = isObjectId(reportId)
      ? await this.verifiedReports.findVerifiedById(reportId)
      : null;
    if (!report) {
      throw new NotFoundException(
        `No verified hazard report ${reportId} to respond to`,
      );
    }

    const team = isObjectId(teamId) ? await this.teams.findById(teamId) : null;
    if (!team) {
      throw new NotFoundException(`Rescue team ${teamId} not found`);
    }
    if (team.status !== TeamStatus.Available) {
      throw this.notAvailable(team.name);
    }

    const dispatchedAt = new Date();
    // The repository only writes if the team is still Available, so two
    // officers choosing the same team cannot both win (extension 7.a).
    const dispatched = await this.teams.dispatch(teamId, {
      reportId,
      dispatchedBy: officerId,
      dispatchedAt,
    });
    if (!dispatched) {
      this.logger.warn(`Team ${teamId} was taken before this dispatch`);
      throw this.notAvailable(team.name);
    }

    const dispatch = await this.dispatches.create({
      reportId,
      teamId,
      teamName: dispatched.name,
      owner: dispatched.owner,
      district: dispatched.district,
      dispatchedBy: officerId,
      dispatchedAt,
    });
    this.logger.log(`Team ${teamId} dispatched to report ${reportId}`);
    return { dispatch, team: dispatched };
  }

  /** The teams already sent to one report, newest first. */
  listForReport(reportId: string): Promise<DispatchRecord[]> {
    if (!isObjectId(reportId)) {
      throw new NotFoundException(`No hazard report ${reportId}`);
    }
    return this.dispatches.findByReport(reportId);
  }

  private notAvailable(teamName: string): ConflictException {
    return new ConflictException(
      `${teamName} was assigned elsewhere. Choose another team.`,
    );
  }
}
