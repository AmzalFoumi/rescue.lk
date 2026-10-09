import { Test } from '@nestjs/testing';
import { describe, it, expect } from 'vitest';
import { DispatchService } from './dispatch.service.js';
import { DispatchesController } from './dispatches.controller.js';
import { DISPATCHES_REPOSITORY } from './dispatches.repository.interface.js';
import { ReliefController } from './relief.controller.js';
import { ReliefDistributionService } from './relief-distribution.service.js';
import { RELIEF_DISTRIBUTIONS_REPOSITORY } from './relief-distributions.repository.interface.js';
import { RescueTeamsController } from './rescue-teams.controller.js';
import { RESCUE_TEAMS_REPOSITORY } from './rescue-teams.repository.interface.js';
import { ResourceAvailabilityService } from './resource-availability.service.js';
import { ResponseController } from './response.controller.js';
import { ResponseTargetsService } from './response-targets.service.js';
import {
  fakeDispatchesRepository,
  fakeReliefRepository,
  fakeSheltersRepository,
  fakeTeamsRepository,
  fakeVerifiedReports,
} from './response.test-data.js';
import { ShelterOccupancyService } from './shelter-occupancy.service.js';
import { SheltersController } from './shelters.controller.js';
import { SHELTERS_REPOSITORY } from './shelters.repository.interface.js';
import { TeamStatusService } from './team-status.service.js';
import { VERIFIED_REPORTS } from './verified-reports.port.js';

// Builds the module with the same providers as ResponseModule, but with fake
// repositories. A missing provider would fail here, not only at startup.
describe('Response wiring', () => {
  it('creates every controller and service', async () => {
    const moduleRef = await Test.createTestingModule({
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
        { provide: RESCUE_TEAMS_REPOSITORY, useValue: fakeTeamsRepository() },
        {
          provide: DISPATCHES_REPOSITORY,
          useValue: fakeDispatchesRepository(),
        },
        { provide: SHELTERS_REPOSITORY, useValue: fakeSheltersRepository() },
        {
          provide: RELIEF_DISTRIBUTIONS_REPOSITORY,
          useValue: fakeReliefRepository(),
        },
        { provide: VERIFIED_REPORTS, useValue: fakeVerifiedReports() },
      ],
    }).compile();

    expect(moduleRef.get(ResponseController)).toBeDefined();
    expect(moduleRef.get(RescueTeamsController)).toBeDefined();
    expect(moduleRef.get(DispatchesController)).toBeDefined();
    expect(moduleRef.get(SheltersController)).toBeDefined();
    expect(moduleRef.get(ReliefController)).toBeDefined();
    expect(moduleRef.get(DispatchService)).toBeDefined();
  });
});
