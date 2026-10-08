import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  HazardReport,
  HazardReportSchema,
} from '../hazard-reports/schemas/hazard-report.schema.js';
import { DispatchService } from './dispatch.service.js';
import { DispatchesController } from './dispatches.controller.js';
import { DISPATCHES_REPOSITORY } from './dispatches.repository.interface.js';
import { MongooseDispatchesRepository } from './mongoose-dispatches.repository.js';
import { MongooseReliefDistributionsRepository } from './mongoose-relief-distributions.repository.js';
import { MongooseRescueTeamsRepository } from './mongoose-rescue-teams.repository.js';
import { MongooseSheltersRepository } from './mongoose-shelters.repository.js';
import { MongooseVerifiedReportsRepository } from './mongoose-verified-reports.repository.js';
import { ReliefController } from './relief.controller.js';
import { ReliefDistributionService } from './relief-distribution.service.js';
import { RELIEF_DISTRIBUTIONS_REPOSITORY } from './relief-distributions.repository.interface.js';
import { RescueTeamsController } from './rescue-teams.controller.js';
import { RESCUE_TEAMS_REPOSITORY } from './rescue-teams.repository.interface.js';
import { ResourceAvailabilityService } from './resource-availability.service.js';
import { ResponseController } from './response.controller.js';
import { ResponseTargetsService } from './response-targets.service.js';
import { Dispatch, DispatchSchema } from './schemas/dispatch.schema.js';
import {
  Organisation,
  OrganisationSchema,
} from './schemas/organisation.schema.js';
import {
  ReliefDistribution,
  ReliefDistributionSchema,
} from './schemas/relief-distribution.schema.js';
import { RescueTeam, RescueTeamSchema } from './schemas/rescue-team.schema.js';
import { Shelter, ShelterSchema } from './schemas/shelter.schema.js';
import { ShelterOccupancyService } from './shelter-occupancy.service.js';
import { SheltersController } from './shelters.controller.js';
import { SHELTERS_REPOSITORY } from './shelters.repository.interface.js';
import { TeamStatusService } from './team-status.service.js';
import { VERIFIED_REPORTS } from './verified-reports.port.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organisation.name, schema: OrganisationSchema },
      { name: RescueTeam.name, schema: RescueTeamSchema },
      { name: Dispatch.name, schema: DispatchSchema },
      { name: Shelter.name, schema: ShelterSchema },
      { name: ReliefDistribution.name, schema: ReliefDistributionSchema },
      // Read only: response coordination lists verified hazard reports.
      { name: HazardReport.name, schema: HazardReportSchema },
    ]),
  ],
  controllers: [
    ResponseController,
    RescueTeamsController,
    DispatchesController,
    SheltersController,
    ReliefController,
  ],
  providers: [
    ResponseTargetsService,
    ResourceAvailabilityService,
    DispatchService,
    TeamStatusService,
    ShelterOccupancyService,
    ReliefDistributionService,
    {
      provide: RESCUE_TEAMS_REPOSITORY,
      useClass: MongooseRescueTeamsRepository,
    },
    { provide: DISPATCHES_REPOSITORY, useClass: MongooseDispatchesRepository },
    { provide: SHELTERS_REPOSITORY, useClass: MongooseSheltersRepository },
    {
      provide: RELIEF_DISTRIBUTIONS_REPOSITORY,
      useClass: MongooseReliefDistributionsRepository,
    },
    { provide: VERIFIED_REPORTS, useClass: MongooseVerifiedReportsRepository },
  ],
})
export class ResponseModule {}
