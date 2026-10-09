import { describe, beforeEach, it, expect, vi } from 'vitest';
import { DispatchService } from './dispatch.service.js';
import { DispatchesController } from './dispatches.controller.js';
import type { DispatchRescueTeamDto } from './dto/dispatch-rescue-team.dto.js';
import type { LogReliefDistributionDto } from './dto/log-relief-distribution.dto.js';
import { ReliefController } from './relief.controller.js';
import { ReliefDistributionService } from './relief-distribution.service.js';
import { RescueTeamsController } from './rescue-teams.controller.js';
import { ResourceAvailabilityService } from './resource-availability.service.js';
import { ResponseController } from './response.controller.js';
import { ResponseTargetsService } from './response-targets.service.js';
import {
  DISTRICT_ID,
  OFFICER_ID,
  REPORT_ID,
  SHELTER_ID,
  TEAM_ID,
} from './response.test-data.js';
import { ShelterOccupancyService } from './shelter-occupancy.service.js';
import { SheltersController } from './shelters.controller.js';
import { TeamStatus } from './team-status.js';
import { TeamStatusService } from './team-status.service.js';

// The controllers only pass requests to the services, so the services are mocks.
describe('Response controllers', () => {
  const targetsService = { list: vi.fn().mockResolvedValue([]) };
  const availabilityService = {
    listTeams: vi.fn().mockResolvedValue({ teams: [], availableCount: 0 }),
    listShelters: vi.fn().mockResolvedValue([]),
  };
  const statusService = {
    getById: vi.fn().mockResolvedValue({ id: TEAM_ID }),
    changeStatus: vi.fn().mockResolvedValue({ id: TEAM_ID }),
  };
  const dispatchService = {
    dispatch: vi.fn().mockResolvedValue({ dispatch: {}, team: {} }),
    listForReport: vi.fn().mockResolvedValue([]),
  };
  const occupancyService = {
    getById: vi.fn().mockResolvedValue({ id: SHELTER_ID }),
    changeOccupancy: vi.fn().mockResolvedValue({ id: SHELTER_ID }),
  };
  const reliefService = {
    list: vi.fn().mockResolvedValue([]),
    log: vi.fn().mockResolvedValue({ id: 'r1' }),
  };

  const asTargets = () => targetsService as unknown as ResponseTargetsService;
  const asAvailability = () =>
    availabilityService as unknown as ResourceAvailabilityService;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ResponseController', () => {
    let controller: ResponseController;

    beforeEach(() => {
      controller = new ResponseController(asTargets());
    });

    it('returns health status', () => {
      expect(controller.health()).toEqual({ status: 'ok', module: 'response' });
    });

    it('lists the reports that need a response', async () => {
      await controller.listReports();
      expect(targetsService.list).toHaveBeenCalled();
    });
  });

  describe('RescueTeamsController', () => {
    let controller: RescueTeamsController;

    beforeEach(() => {
      controller = new RescueTeamsController(
        asAvailability(),
        statusService as unknown as TeamStatusService,
      );
    });

    it('lists every team when no filter is given', async () => {
      await controller.list();
      expect(availabilityService.listTeams).toHaveBeenCalledWith({
        district: undefined,
        status: undefined,
      });
    });

    it('passes the district and status filters on', async () => {
      await controller.list(DISTRICT_ID, TeamStatus.Available);
      expect(availabilityService.listTeams).toHaveBeenCalledWith({
        district: DISTRICT_ID,
        status: TeamStatus.Available,
      });
    });

    it('returns one team', async () => {
      await controller.getById(TEAM_ID);
      expect(statusService.getById).toHaveBeenCalledWith(TEAM_ID);
    });

    it('changes a team status', async () => {
      await controller.changeStatus(TEAM_ID, { status: TeamStatus.Returning });
      expect(statusService.changeStatus).toHaveBeenCalledWith(
        TEAM_ID,
        TeamStatus.Returning,
      );
    });
  });

  describe('DispatchesController', () => {
    let controller: DispatchesController;
    const dto: DispatchRescueTeamDto = {
      reportId: REPORT_ID,
      teamId: TEAM_ID,
      officerId: OFFICER_ID,
    };

    beforeEach(() => {
      controller = new DispatchesController(
        dispatchService as unknown as DispatchService,
      );
    });

    it('dispatches a team', async () => {
      await controller.dispatch(dto);
      expect(dispatchService.dispatch).toHaveBeenCalledWith(
        REPORT_ID,
        TEAM_ID,
        OFFICER_ID,
      );
    });

    it('lists the dispatches of a report', async () => {
      await controller.listForReport(REPORT_ID);
      expect(dispatchService.listForReport).toHaveBeenCalledWith(REPORT_ID);
    });
  });

  describe('SheltersController', () => {
    let controller: SheltersController;

    beforeEach(() => {
      controller = new SheltersController(
        asAvailability(),
        occupancyService as unknown as ShelterOccupancyService,
      );
    });

    it('lists shelters, filtered by district when asked', async () => {
      await controller.list();
      expect(availabilityService.listShelters).toHaveBeenCalledWith(undefined);

      await controller.list(DISTRICT_ID);
      expect(availabilityService.listShelters).toHaveBeenCalledWith(
        DISTRICT_ID,
      );
    });

    it('returns one shelter', async () => {
      await controller.getById(SHELTER_ID);
      expect(occupancyService.getById).toHaveBeenCalledWith(SHELTER_ID);
    });

    it('changes the occupancy', async () => {
      await controller.changeOccupancy(SHELTER_ID, { people: 25 });
      expect(occupancyService.changeOccupancy).toHaveBeenCalledWith(
        SHELTER_ID,
        25,
      );
    });
  });

  describe('ReliefController', () => {
    let controller: ReliefController;
    const dto = {
      item: 'water',
      quantity: 500,
      district: DISTRICT_ID,
    } as LogReliefDistributionDto;

    beforeEach(() => {
      controller = new ReliefController(
        reliefService as unknown as ReliefDistributionService,
      );
    });

    it('lists distributions, filtered by district when asked', async () => {
      await controller.list();
      expect(reliefService.list).toHaveBeenCalledWith(undefined);

      await controller.list(DISTRICT_ID);
      expect(reliefService.list).toHaveBeenCalledWith(DISTRICT_ID);
    });

    it('logs a distribution', async () => {
      await controller.log(dto);
      expect(reliefService.log).toHaveBeenCalledWith(dto);
    });
  });
});
