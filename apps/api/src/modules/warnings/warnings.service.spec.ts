import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  describe,
  beforeEach,
  afterEach,
  it,
  expect,
  vi,
  type Mocked,
} from 'vitest';
import type { AlertChannelType } from '@rescue-lk/shared';
import { WarningsService } from './warnings.service.js';
import {
  WARNINGS_REPOSITORY,
  type WarningsRepository,
} from './warnings.repository.interface.js';
import {
  DELIVERY_RECORDS_REPOSITORY,
  type DeliveryRecordEntry,
  type DeliveryRecordsRepository,
} from './delivery-records.repository.interface.js';
import {
  HAZARD_REPORT_LOOKUP,
  type HazardReportLookup,
} from './hazard-report-lookup/hazard-report-lookup.interface.js';
import { CLOCK } from './domain/clock.js';
import { WarningValidator } from './validation/warning.validator.js';
import { ChannelRegistry } from './channels/channel.registry.js';
import type { AlertChannel } from './channels/alert-channel.interface.js';
import { WarningDeliveryService } from './delivery/warning-delivery.service.js';
import { HazardReportNotFoundException } from './exceptions/hazard-report-not-found.exception.js';
import { ReportNotVerifiedException } from './exceptions/report-not-verified.exception.js';
import { InvalidWarningException } from './exceptions/invalid-warning.exception.js';
import { UnsupportedChannelException } from './exceptions/unsupported-channel.exception.js';
import { WarningNotFoundException } from './exceptions/warning-not-found.exception.js';
import { MILLISECONDS_PER_HOUR } from './warnings.constants.js';
import {
  FIXED_NOW,
  VERIFIED_REPORT,
  WARNING_ID,
  buildIssueWarningCommand,
  buildWarningRecord,
  fixedClock,
} from './testing/warning.fixtures.js';

const fakeChannel = (type: AlertChannelType) => ({
  type,
  send: vi.fn<AlertChannel['send']>().mockResolvedValue({ success: true }),
});

const sentPush: DeliveryRecordEntry = {
  id: '665f1b2c9d3e4a0012345671',
  warningId: WARNING_ID,
  channel: 'push',
  status: 'sent',
  attempts: 1,
  lastAttemptAt: new Date(FIXED_NOW),
};

describe('WarningsService', () => {
  let service: WarningsService;
  let warningsRepository: Mocked<WarningsRepository>;
  let deliveryRecordsRepository: Mocked<DeliveryRecordsRepository>;
  let hazardReports: Mocked<HazardReportLookup>;
  let deliveryService: Mocked<Pick<WarningDeliveryService, 'deliver'>>;
  let push: ReturnType<typeof fakeChannel>;
  let sms: ReturnType<typeof fakeChannel>;

  beforeEach(async () => {
    warningsRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      updateStatus: vi.fn(),
    };
    deliveryRecordsRepository = {
      create: vi.fn(),
      findByWarningId: vi.fn(),
      update: vi.fn(),
    };
    hazardReports = {
      findById: vi.fn().mockResolvedValue(VERIFIED_REPORT),
      findVerified: vi.fn(),
    };
    deliveryService = { deliver: vi.fn() };
    // Only push and sms are registered, so 'audible' is an unsupported channel here.
    push = fakeChannel('push');
    sms = fakeChannel('sms');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WarningsService,
        WarningValidator,
        {
          provide: ChannelRegistry,
          useValue: new ChannelRegistry([push, sms]),
        },
        { provide: WARNINGS_REPOSITORY, useValue: warningsRepository },
        {
          provide: DELIVERY_RECORDS_REPOSITORY,
          useValue: deliveryRecordsRepository,
        },
        { provide: HAZARD_REPORT_LOOKUP, useValue: hazardReports },
        { provide: WarningDeliveryService, useValue: deliveryService },
        { provide: CLOCK, useValue: fixedClock },
      ],
    }).compile();

    service = module.get(WarningsService);
    vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const expectNothingIssued = () => {
    expect(warningsRepository.create).not.toHaveBeenCalled();
    expect(deliveryService.deliver).not.toHaveBeenCalled();
    expect(push.send).not.toHaveBeenCalled();
    expect(sms.send).not.toHaveBeenCalled();
  };

  it('reports health', () => {
    expect(service.health()).toEqual({ status: 'ok', module: 'warnings' });
  });

  describe('issueWarning', () => {
    it('saves the warning, delivers it and returns both as DTOs', async () => {
      const command = buildIssueWarningCommand();
      const warning = buildWarningRecord();
      warningsRepository.create.mockResolvedValue(warning);
      deliveryService.deliver.mockResolvedValue([sentPush]);

      const result = await service.issueWarning(command);

      expect(warningsRepository.create).toHaveBeenCalledWith({
        ...command,
        issuedAt: FIXED_NOW,
      });
      expect(deliveryService.deliver).toHaveBeenCalledWith(warning);
      expect(result).toEqual({
        warning: expect.objectContaining({
          id: WARNING_ID,
          issuedAt: FIXED_NOW.toISOString(),
        }),
        deliveries: [
          expect.objectContaining({
            channel: 'push',
            status: 'sent',
            lastAttemptAt: FIXED_NOW.toISOString(),
          }),
        ],
      });
    });

    it('throws HazardReportNotFoundException for an unknown report', async () => {
      hazardReports.findById.mockResolvedValue(null);

      await expect(
        service.issueWarning(buildIssueWarningCommand()),
      ).rejects.toThrow(HazardReportNotFoundException);
      expectNothingIssued();
    });

    it('throws ReportNotVerifiedException, saves nothing and calls no channel for an unverified report', async () => {
      hazardReports.findById.mockResolvedValue({
        ...VERIFIED_REPORT,
        status: 'pending',
      });

      await expect(
        service.issueWarning(buildIssueWarningCommand()),
      ).rejects.toThrow(ReportNotVerifiedException);
      expectNothingIssued();
    });

    it('throws InvalidWarningException and saves nothing when the expiry is in the past', async () => {
      const command = buildIssueWarningCommand({
        expiresAt: new Date(FIXED_NOW.getTime() - MILLISECONDS_PER_HOUR),
      });

      await expect(service.issueWarning(command)).rejects.toThrow(
        InvalidWarningException,
      );
      expectNothingIssued();
    });

    it('throws UnsupportedChannelException before saving anything', async () => {
      const command = buildIssueWarningCommand({
        channels: ['push', 'audible'],
      });

      await expect(service.issueWarning(command)).rejects.toThrow(
        UnsupportedChannelException,
      );
      expectNothingIssued();
    });
  });

  it('listVerifiedReports returns the verified reports from the lookup', async () => {
    hazardReports.findVerified.mockResolvedValue([VERIFIED_REPORT]);

    await expect(service.listVerifiedReports()).resolves.toEqual([
      VERIFIED_REPORT,
    ]);
  });

  it('listWarnings returns every warning as a DTO', async () => {
    const warning = buildWarningRecord();
    warningsRepository.findAll.mockResolvedValue([warning]);

    await expect(service.listWarnings()).resolves.toEqual([
      expect.objectContaining({
        id: WARNING_ID,
        expiresAt: warning.expiresAt.toISOString(),
      }),
    ]);
  });

  describe('getDeliveries', () => {
    it('returns the delivery records of an existing warning as DTOs', async () => {
      warningsRepository.findById.mockResolvedValue(buildWarningRecord());
      deliveryRecordsRepository.findByWarningId.mockResolvedValue([sentPush]);

      await expect(service.getDeliveries(WARNING_ID)).resolves.toEqual([
        expect.objectContaining({
          id: sentPush.id,
          lastAttemptAt: FIXED_NOW.toISOString(),
        }),
      ]);
      expect(deliveryRecordsRepository.findByWarningId).toHaveBeenCalledWith(
        WARNING_ID,
      );
    });

    it('throws WarningNotFoundException for an unknown warning', async () => {
      warningsRepository.findById.mockResolvedValue(null);

      await expect(service.getDeliveries(WARNING_ID)).rejects.toThrow(
        WarningNotFoundException,
      );
      expect(deliveryRecordsRepository.findByWarningId).not.toHaveBeenCalled();
    });
  });
});
