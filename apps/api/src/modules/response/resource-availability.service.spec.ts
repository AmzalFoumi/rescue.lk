import { describe, beforeEach, it, expect, vi } from 'vitest';
import { OrganisationKind } from './organisation.js';
import type { RescueTeamsRepository } from './rescue-teams.repository.interface.js';
import { ResourceAvailabilityService } from './resource-availability.service.js';
import {
  DISTRICT_ID,
  fakeSheltersRepository,
  fakeTeamsRepository,
  ngoOwner,
  shelter,
  team,
} from './response.test-data.js';
import { ShelterStatus } from './shelter.js';
import type { SheltersRepository } from './shelters.repository.interface.js';
import { TeamStatus } from './team-status.js';

describe('ResourceAvailabilityService', () => {
  let service: ResourceAvailabilityService;
  let teams: RescueTeamsRepository;
  let shelters: SheltersRepository;

  beforeEach(() => {
    teams = fakeTeamsRepository();
    shelters = fakeSheltersRepository();
    service = new ResourceAvailabilityService(teams, shelters);
  });

  describe('listTeams', () => {
    it('shows teams from every organisation in one list', async () => {
      vi.mocked(teams.findAll).mockResolvedValue([
        team(),
        team({ id: 'team-2', owner: ngoOwner }),
      ]);

      const { teams: listed } = await service.listTeams();

      expect(listed.map((t) => t.owner.kind)).toEqual([
        OrganisationKind.ArmedForces,
        OrganisationKind.Ngo,
      ]);
    });

    it('counts only the teams that can be dispatched', async () => {
      vi.mocked(teams.findAll).mockResolvedValue([
        team(),
        team({ id: 'team-2', status: TeamStatus.Dispatched }),
      ]);

      const { availableCount } = await service.listTeams();

      expect(availableCount).toBe(1);
    });

    // Extension 5.a: no team is available, so no dispatch is made.
    it('reports no availability when every team is busy', async () => {
      vi.mocked(teams.findAll).mockResolvedValue([
        team({ status: TeamStatus.Dispatched }),
      ]);

      expect((await service.listTeams()).availableCount).toBe(0);
    });

    it('passes the district and status filter to the repository', async () => {
      await service.listTeams({
        district: DISTRICT_ID,
        status: TeamStatus.Available,
      });

      expect(teams.findAll).toHaveBeenCalledWith({
        district: DISTRICT_ID,
        status: TeamStatus.Available,
      });
    });
  });

  describe('listShelters', () => {
    it('works out the status and free places of each shelter', async () => {
      vi.mocked(shelters.findAll).mockResolvedValue([
        shelter({ capacity: 400, currentOccupancy: 400 }),
      ]);

      const [view] = await service.listShelters();

      expect(view.status).toBe(ShelterStatus.Full);
      expect(view.placesAvailable).toBe(0);
    });

    it('asks only for the shelters of one district', async () => {
      await service.listShelters(DISTRICT_ID);

      expect(shelters.findAll).toHaveBeenCalledWith(DISTRICT_ID);
    });
  });
});
