import { ConflictException, NotFoundException } from '@nestjs/common';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import type { RescueTeamsRepository } from './rescue-teams.repository.interface.js';
import {
  MISSING_ID,
  TEAM_ID,
  fakeTeamsRepository,
  team,
} from './response.test-data.js';
import { TeamStatus } from './team-status.js';
import { TeamStatusService } from './team-status.service.js';

describe('TeamStatusService', () => {
  let service: TeamStatusService;
  let teams: RescueTeamsRepository;

  beforeEach(() => {
    teams = fakeTeamsRepository();
    service = new TeamStatusService(teams);
  });

  describe('getById', () => {
    it('returns a team', async () => {
      expect((await service.getById(TEAM_ID)).id).toBe(TEAM_ID);
    });

    it('throws NotFound for an unknown id', async () => {
      vi.mocked(teams.findById).mockResolvedValue(null);
      await expect(service.getById(MISSING_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFound for a malformed id without asking the database', async () => {
      await expect(service.getById('abc')).rejects.toThrow(NotFoundException);
      expect(teams.findById).not.toHaveBeenCalled();
    });
  });

  describe('changeStatus', () => {
    it('moves a dispatched team to Returning and frees it', async () => {
      vi.mocked(teams.findById).mockResolvedValue(
        team({ status: TeamStatus.Dispatched }),
      );

      await service.changeStatus(TEAM_ID, TeamStatus.Returning);

      expect(teams.changeStatus).toHaveBeenCalledWith(
        TEAM_ID,
        TeamStatus.Returning,
        true,
      );
    });

    it('refuses to dispatch a team by hand', async () => {
      await expect(
        service.changeStatus(TEAM_ID, TeamStatus.Dispatched),
      ).rejects.toThrow(ConflictException);
      expect(teams.changeStatus).not.toHaveBeenCalled();
    });

    it('refuses a change the status rules do not allow', async () => {
      vi.mocked(teams.findById).mockResolvedValue(
        team({ status: TeamStatus.Unavailable }),
      );

      await expect(
        service.changeStatus(TEAM_ID, TeamStatus.Returning),
      ).rejects.toThrow(ConflictException);
    });

    it('throws NotFound when the team disappears before the update', async () => {
      vi.mocked(teams.changeStatus).mockResolvedValue(null);

      await expect(
        service.changeStatus(TEAM_ID, TeamStatus.Unavailable),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
