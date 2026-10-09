import { ConflictException, NotFoundException } from '@nestjs/common';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { DispatchService } from './dispatch.service.js';
import type { DispatchesRepository } from './dispatches.repository.interface.js';
import type { RescueTeamsRepository } from './rescue-teams.repository.interface.js';
import {
  MISSING_ID,
  OFFICER_ID,
  REPORT_ID,
  TEAM_ID,
  fakeDispatchesRepository,
  fakeTeamsRepository,
  fakeVerifiedReports,
  team,
} from './response.test-data.js';
import { TeamStatus } from './team-status.js';
import type { VerifiedReportsPort } from './verified-reports.port.js';

describe('DispatchService', () => {
  let service: DispatchService;
  let teams: RescueTeamsRepository;
  let dispatches: DispatchesRepository;
  let verifiedReports: VerifiedReportsPort;

  beforeEach(() => {
    teams = fakeTeamsRepository();
    dispatches = fakeDispatchesRepository();
    verifiedReports = fakeVerifiedReports();
    service = new DispatchService(teams, dispatches, verifiedReports);
  });

  describe('dispatch', () => {
    it('sets the team to Dispatched and records who sent it', async () => {
      const result = await service.dispatch(REPORT_ID, TEAM_ID, OFFICER_ID);

      expect(teams.dispatch).toHaveBeenCalledWith(
        TEAM_ID,
        expect.objectContaining({
          reportId: REPORT_ID,
          dispatchedBy: OFFICER_ID,
          dispatchedAt: expect.any(Date),
        }),
      );
      expect(result.team.status).toBe(TeamStatus.Dispatched);
    });

    it('writes a dispatch record with the team and its owner', async () => {
      const result = await service.dispatch(REPORT_ID, TEAM_ID, OFFICER_ID);

      expect(dispatches.create).toHaveBeenCalledWith(
        expect.objectContaining({
          reportId: REPORT_ID,
          teamId: TEAM_ID,
          teamName: 'Army Rescue Unit 3',
          owner: expect.objectContaining({ name: 'Sri Lanka Army' }),
          dispatchedBy: OFFICER_ID,
        }),
      );
      expect(result.dispatch.reportId).toBe(REPORT_ID);
    });

    it('throws NotFound when the report is not verified or missing', async () => {
      vi.mocked(verifiedReports.findVerifiedById).mockResolvedValue(null);

      await expect(
        service.dispatch(MISSING_ID, TEAM_ID, OFFICER_ID),
      ).rejects.toThrow(NotFoundException);
      expect(teams.dispatch).not.toHaveBeenCalled();
    });

    it('throws NotFound for a malformed report id without asking the database', async () => {
      await expect(
        service.dispatch('abc', TEAM_ID, OFFICER_ID),
      ).rejects.toThrow(NotFoundException);
      expect(verifiedReports.findVerifiedById).not.toHaveBeenCalled();
    });

    it('throws NotFound for an unknown team', async () => {
      vi.mocked(teams.findById).mockResolvedValue(null);

      await expect(
        service.dispatch(REPORT_ID, MISSING_ID, OFFICER_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFound for a malformed team id without asking the database', async () => {
      await expect(
        service.dispatch(REPORT_ID, 'xyz', OFFICER_ID),
      ).rejects.toThrow(NotFoundException);
      expect(teams.findById).not.toHaveBeenCalled();
    });

    it('throws Conflict when the team is already dispatched', async () => {
      vi.mocked(teams.findById).mockResolvedValue(
        team({ status: TeamStatus.Dispatched }),
      );

      await expect(
        service.dispatch(REPORT_ID, TEAM_ID, OFFICER_ID),
      ).rejects.toThrow(ConflictException);
      expect(teams.dispatch).not.toHaveBeenCalled();
    });

    // Extension 7.a: the team was taken between reading it and writing.
    it('throws Conflict when the team is taken during the dispatch', async () => {
      vi.mocked(teams.dispatch).mockResolvedValue(null);

      await expect(
        service.dispatch(REPORT_ID, TEAM_ID, OFFICER_ID),
      ).rejects.toThrow(ConflictException);
      expect(dispatches.create).not.toHaveBeenCalled();
    });

    // Extension 8.a: more support for the same report.
    it('allows a second team to be sent to the same report', async () => {
      vi.mocked(teams.findById).mockResolvedValue(team({ id: 'team-2' }));

      await service.dispatch(REPORT_ID, TEAM_ID, OFFICER_ID);
      await service.dispatch(REPORT_ID, TEAM_ID, OFFICER_ID);

      expect(dispatches.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('listForReport', () => {
    it('returns the teams already sent to a report', async () => {
      const result = await service.listForReport(REPORT_ID);

      expect(dispatches.findByReport).toHaveBeenCalledWith(REPORT_ID);
      expect(result).toHaveLength(1);
    });

    it('throws NotFound for a malformed report id', () => {
      expect(() => service.listForReport('nope')).toThrow(NotFoundException);
    });
  });
});
