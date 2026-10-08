import { Test, TestingModule } from '@nestjs/testing';
import { describe, beforeEach, it, expect, vi, type Mocked } from 'vitest';
import { WarningsController } from './warnings.controller.js';
import { WarningsService } from './warnings.service.js';
import { WarningQueryService } from './warning-query.service.js';
import type { SubmitWarningDto } from './dto/submit-warning.dto.js';
import type { UpdateWarningDto } from './dto/update-warning.dto.js';
import {
  toSubmitWarningCommand,
  toWarningContent,
  toWarningDto,
} from './warnings.mapper.js';
import {
  OFFICER,
  VERIFIED_REPORT,
  WARNING_ID,
  buildWarningRecord,
} from './testing/warning.fixtures.js';

const RECORD_ID = '665f1b2c9d3e4a0012345671';

const submitBody: SubmitWarningDto = {
  sourceReportId: VERIFIED_REPORT.id,
  hazard: 'FLOOD',
  severity: 'HIGH',
  areaIds: ['B-KALU'],
  message: 'The Kalu Ganga is rising quickly near Ratnapura.',
  instructions: 'Move to higher ground.',
  channels: ['SMS', 'PUSH'],
  createdBy: OFFICER,
};

const { sourceReportId: _source, ...updateBody } = submitBody;

// One mock stands in for both services: commands and read-only queries.
type WarningsServiceMock = Mocked<
  Pick<
    WarningsService,
    'health' | 'saveDraft' | 'publish' | 'update' | 'cancel' | 'retryDelivery'
  > &
    Pick<
      WarningQueryService,
      | 'listVerifiedReports'
      | 'listTargetAreas'
      | 'estimateReach'
      | 'list'
      | 'latestDeliveries'
    >
>;

describe('WarningsController', () => {
  let controller: WarningsController;
  let service: WarningsServiceMock;
  const warningDto = toWarningDto(buildWarningRecord());
  const result = { warning: warningDto, deliveries: [] };

  beforeEach(async () => {
    service = {
      health: vi.fn().mockReturnValue({ status: 'ok', module: 'warnings' }),
      listVerifiedReports: vi.fn().mockResolvedValue([VERIFIED_REPORT]),
      listTargetAreas: vi.fn().mockReturnValue([]),
      estimateReach: vi.fn().mockReturnValue({ districts: [], channels: [] }),
      list: vi.fn().mockResolvedValue([warningDto]),
      saveDraft: vi.fn().mockResolvedValue(warningDto),
      publish: vi.fn().mockResolvedValue(result),
      update: vi.fn().mockResolvedValue(result),
      cancel: vi.fn().mockResolvedValue(warningDto),
      latestDeliveries: vi.fn().mockResolvedValue([]),
      retryDelivery: vi.fn().mockResolvedValue({ id: RECORD_ID }),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WarningsController],
      providers: [
        { provide: WarningsService, useValue: service },
        { provide: WarningQueryService, useValue: service },
      ],
    }).compile();

    controller = module.get(WarningsController);
  });

  it('returns health status', () => {
    expect(controller.health()).toEqual({ status: 'ok', module: 'warnings' });
  });

  it('lists verified reports', async () => {
    await expect(controller.listVerifiedReports()).resolves.toEqual([
      VERIFIED_REPORT,
    ]);
  });

  it('lists target areas', () => {
    expect(controller.listTargetAreas()).toEqual([]);
    expect(service.listTargetAreas).toHaveBeenCalled();
  });

  it('estimates reach for the requested areas', () => {
    expect(controller.estimateReach({ areaIds: ['B-KALU'] })).toEqual({
      districts: [],
      channels: [],
    });
    expect(service.estimateReach).toHaveBeenCalledWith(['B-KALU']);
  });

  it('lists warnings, passing the status filter through', async () => {
    await expect(controller.list({ status: 'ACTIVE' })).resolves.toEqual([
      warningDto,
    ]);
    expect(service.list).toHaveBeenCalledWith('ACTIVE');
  });

  it('saves a draft from the mapped body', async () => {
    await expect(controller.saveDraft(submitBody)).resolves.toBe(warningDto);
    expect(service.saveDraft).toHaveBeenCalledWith(
      toSubmitWarningCommand(submitBody),
    );
  });

  it('publishes from the mapped body', async () => {
    await expect(controller.publish(submitBody)).resolves.toBe(result);
    expect(service.publish).toHaveBeenCalledWith(
      toSubmitWarningCommand(submitBody),
    );
  });

  it('updates the warning in the path with the mapped content', async () => {
    await expect(
      controller.update({ id: WARNING_ID }, updateBody as UpdateWarningDto),
    ).resolves.toBe(result);
    expect(service.update).toHaveBeenCalledWith({
      warningId: WARNING_ID,
      content: toWarningContent(updateBody),
    });
  });

  it('cancels the warning in the path with the reason', async () => {
    await expect(
      controller.cancel({ id: WARNING_ID }, { reason: 'Water receding' }),
    ).resolves.toBe(warningDto);
    expect(service.cancel).toHaveBeenCalledWith({
      warningId: WARNING_ID,
      reason: 'Water receding',
    });
  });

  it('returns the latest deliveries of the warning in the path', async () => {
    await controller.latestDeliveries({ id: WARNING_ID });

    expect(service.latestDeliveries).toHaveBeenCalledWith(WARNING_ID);
  });

  it('retries the delivery record in the path', async () => {
    await expect(
      controller.retryDelivery({ recordId: RECORD_ID }),
    ).resolves.toEqual({ id: RECORD_ID });
    expect(service.retryDelivery).toHaveBeenCalledWith(RECORD_ID);
  });
});
