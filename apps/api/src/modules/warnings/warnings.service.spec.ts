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
  type DeliveryRecordsRepository,
} from './delivery-records.repository.interface.js';
import {
  HAZARD_REPORT_LOOKUP,
  type HazardReportLookup,
} from './hazard-report-lookup/hazard-report-lookup.interface.js';
import { TARGET_AREA_CATALOG } from './target-areas/target-area-catalog.interface.js';
import { InMemoryTargetAreaCatalog } from './target-areas/in-memory-target-area-catalog.js';
import { CLOCK } from './domain/clock.js';
import type { WarningContent } from './domain/warning-form.js';
import { WarningValidator } from './validation/warning.validator.js';
import { ChannelRegistry } from './channels/channel.registry.js';
import type { AlertChannel } from './channels/alert-channel.interface.js';
import { WarningDeliveryService } from './delivery/warning-delivery.service.js';
import { HazardReportNotFoundException } from './exceptions/hazard-report-not-found.exception.js';
import { ReportNotVerifiedException } from './exceptions/report-not-verified.exception.js';
import { InvalidWarningException } from './exceptions/invalid-warning.exception.js';
import { UnsupportedChannelException } from './exceptions/unsupported-channel.exception.js';
import { WarningNotFoundException } from './exceptions/warning-not-found.exception.js';
import { WarningStatusConflictException } from './exceptions/warning-status-conflict.exception.js';
import {
  FIXED_NOW,
  OFFICER,
  VERIFIED_REPORT,
  WARNING_ID,
  buildDeliveryRecord,
  buildWarningForm,
  buildWarningRecord,
  fixedClock,
} from './testing/warning.fixtures.js';

const fakeChannel = (type: AlertChannelType) => ({
  type,
  send: vi
    .fn<AlertChannel['send']>()
    .mockResolvedValue({ success: true, recipients: 1 }),
});

// What every newly created warning starts with, apart from status and dates.
const NEW_WARNING_DEFAULTS = {
  version: 1,
  createdBy: OFFICER,
  createdAt: FIXED_NOW,
  updatedAt: null,
  cancelledAt: null,
  cancelReason: '',
};

const contentOf = ({
  sourceReportId: _source,
  ...content
}: ReturnType<typeof buildWarningForm>): WarningContent => content;

describe('WarningsService', () => {
  let service: WarningsService;
  let warningsRepository: Mocked<WarningsRepository>;
  let deliveryRecordsRepository: Mocked<DeliveryRecordsRepository>;
  let hazardReports: Mocked<HazardReportLookup>;
  let deliveryService: Mocked<
    Pick<WarningDeliveryService, 'deliver' | 'retry'>
  >;
  let sms: ReturnType<typeof fakeChannel>;
  let push: ReturnType<typeof fakeChannel>;

  beforeEach(async () => {
    warningsRepository = {
      create: vi.fn((input) => Promise.resolve({ id: WARNING_ID, ...input })),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
    };
    deliveryRecordsRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByWarningVersion: vi.fn(),
      update: vi.fn(),
    };
    hazardReports = {
      findById: vi.fn().mockResolvedValue(VERIFIED_REPORT),
      findVerified: vi.fn(),
    };
    deliveryService = {
      deliver: vi.fn().mockResolvedValue([buildDeliveryRecord()]),
      retry: vi.fn(),
    };
    // Only SMS and PUSH are registered, so SIREN is unsupported here.
    sms = fakeChannel('SMS');
    push = fakeChannel('PUSH');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WarningsService,
        WarningValidator,
        { provide: TARGET_AREA_CATALOG, useClass: InMemoryTargetAreaCatalog },
        {
          provide: ChannelRegistry,
          useValue: new ChannelRegistry([sms, push]),
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

  const expectNothingSaved = () => {
    expect(warningsRepository.create).not.toHaveBeenCalled();
    expect(warningsRepository.update).not.toHaveBeenCalled();
    expect(deliveryService.deliver).not.toHaveBeenCalled();
    expect(sms.send).not.toHaveBeenCalled();
    expect(push.send).not.toHaveBeenCalled();
  };

  // The guarded update finds the warning no longer in the expected status.
  const guardFailsWith = (current: ReturnType<typeof buildWarningRecord>) => {
    warningsRepository.update.mockResolvedValue(null);
    warningsRepository.findById.mockResolvedValue(current);
  };

  it('reports health', () => {
    expect(service.health()).toEqual({ status: 'ok', module: 'warnings' });
  });

  describe('saveDraft', () => {
    it('creates a DRAFT version 1 warning without delivering it', async () => {
      const form = buildWarningForm();

      const draft = await service.saveDraft({ form, createdBy: OFFICER });

      expect(warningsRepository.create).toHaveBeenCalledWith({
        ...form,
        ...NEW_WARNING_DEFAULTS,
        status: 'DRAFT',
        publishedAt: null,
      });
      expect(draft).toMatchObject({ id: WARNING_ID, status: 'DRAFT' });
      expect(deliveryService.deliver).not.toHaveBeenCalled();
    });

    it('accepts a draft without instructions or channels', async () => {
      await expect(
        service.saveDraft({
          form: buildWarningForm({ instructions: '', channels: [] }),
          createdBy: OFFICER,
        }),
      ).resolves.toMatchObject({ status: 'DRAFT' });
    });

    it('rejects an invalid draft and saves nothing', async () => {
      await expect(
        service.saveDraft({
          form: buildWarningForm({ areaIds: [] }),
          createdBy: OFFICER,
        }),
      ).rejects.toThrow(InvalidWarningException);
      expectNothingSaved();
    });

    it('rejects a draft for an unverified report and saves nothing', async () => {
      hazardReports.findById.mockResolvedValue({
        ...VERIFIED_REPORT,
        status: 'pending',
      });

      await expect(
        service.saveDraft({ form: buildWarningForm(), createdBy: OFFICER }),
      ).rejects.toThrow(ReportNotVerifiedException);
      expectNothingSaved();
    });

    it('updates an existing draft while it is still a DRAFT', async () => {
      const form = buildWarningForm({ severity: 'CRITICAL' });
      warningsRepository.update.mockResolvedValue(
        buildWarningRecord({ status: 'DRAFT', severity: 'CRITICAL' }),
      );

      const draft = await service.saveDraft({
        form,
        createdBy: OFFICER,
        draftId: WARNING_ID,
      });

      expect(warningsRepository.update).toHaveBeenCalledWith({
        id: WARNING_ID,
        expectedStatus: 'DRAFT',
        changes: { ...form, updatedAt: FIXED_NOW },
      });
      expect(warningsRepository.create).not.toHaveBeenCalled();
      expect(draft).toMatchObject({ status: 'DRAFT', severity: 'CRITICAL' });
    });

    it('refuses to edit a warning that is no longer a DRAFT', async () => {
      guardFailsWith(buildWarningRecord({ status: 'ACTIVE' }));

      await expect(
        service.saveDraft({
          form: buildWarningForm(),
          createdBy: OFFICER,
          draftId: WARNING_ID,
        }),
      ).rejects.toThrow(WarningStatusConflictException);
    });

    it('throws WarningNotFoundException for an unknown draft', async () => {
      warningsRepository.update.mockResolvedValue(null);
      warningsRepository.findById.mockResolvedValue(null);

      await expect(
        service.saveDraft({
          form: buildWarningForm(),
          createdBy: OFFICER,
          draftId: WARNING_ID,
        }),
      ).rejects.toThrow(WarningNotFoundException);
    });
  });

  describe('publish', () => {
    it('creates an ACTIVE warning, delivers it and returns both as DTOs', async () => {
      const form = buildWarningForm();

      const result = await service.publish({ form, createdBy: OFFICER });

      expect(warningsRepository.create).toHaveBeenCalledWith({
        ...form,
        ...NEW_WARNING_DEFAULTS,
        status: 'ACTIVE',
        publishedAt: FIXED_NOW,
      });
      expect(deliveryService.deliver).toHaveBeenCalledWith(
        expect.objectContaining({ id: WARNING_ID, status: 'ACTIVE' }),
      );
      expect(result.warning).toMatchObject({
        status: 'ACTIVE',
        publishedAt: FIXED_NOW.toISOString(),
      });
      expect(result.deliveries).toEqual([
        expect.objectContaining({ channel: 'SMS', status: 'SENT' }),
      ]);
    });

    it('publishes an existing DRAFT and delivers it', async () => {
      const form = buildWarningForm();
      const published = buildWarningRecord({ publishedAt: FIXED_NOW });
      warningsRepository.update.mockResolvedValue(published);

      await service.publish({ form, createdBy: OFFICER, draftId: WARNING_ID });

      expect(warningsRepository.update).toHaveBeenCalledWith({
        id: WARNING_ID,
        expectedStatus: 'DRAFT',
        changes: { ...form, status: 'ACTIVE', publishedAt: FIXED_NOW },
      });
      expect(warningsRepository.create).not.toHaveBeenCalled();
      expect(deliveryService.deliver).toHaveBeenCalledWith(published);
    });

    it('refuses to publish a draft that was already published, sending nothing', async () => {
      guardFailsWith(buildWarningRecord({ status: 'ACTIVE' }));

      await expect(
        service.publish({
          form: buildWarningForm(),
          createdBy: OFFICER,
          draftId: WARNING_ID,
        }),
      ).rejects.toThrow(WarningStatusConflictException);
      expect(deliveryService.deliver).not.toHaveBeenCalled();
    });

    it('requires instructions and channels, unlike a draft', async () => {
      const error = await service
        .publish({
          form: buildWarningForm({ instructions: '', channels: [] }),
          createdBy: OFFICER,
        })
        .catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(InvalidWarningException);
      expect((error as InvalidWarningException).errors).toEqual({
        instructions: expect.any(String),
        channels: expect.any(String),
      });
      expectNothingSaved();
    });

    it('throws HazardReportNotFoundException and saves nothing for an unknown report', async () => {
      hazardReports.findById.mockResolvedValue(null);

      await expect(
        service.publish({ form: buildWarningForm(), createdBy: OFFICER }),
      ).rejects.toThrow(HazardReportNotFoundException);
      expectNothingSaved();
    });

    it('throws ReportNotVerifiedException and calls no channel for an unverified report', async () => {
      hazardReports.findById.mockResolvedValue({
        ...VERIFIED_REPORT,
        status: 'rejected',
      });

      await expect(
        service.publish({ form: buildWarningForm(), createdBy: OFFICER }),
      ).rejects.toThrow(ReportNotVerifiedException);
      expectNothingSaved();
    });

    it('throws UnsupportedChannelException before saving anything', async () => {
      await expect(
        service.publish({
          form: buildWarningForm({ channels: ['SMS', 'SIREN'] }),
          createdBy: OFFICER,
        }),
      ).rejects.toThrow(UnsupportedChannelException);
      expectNothingSaved();
    });
  });

  describe('update', () => {
    const active = buildWarningRecord({ status: 'ACTIVE', version: 1 });
    const content = contentOf(buildWarningForm({ severity: 'CRITICAL' }));

    it('saves a new version of an ACTIVE warning and re-delivers it', async () => {
      const updated = buildWarningRecord({ version: 2, severity: 'CRITICAL' });
      warningsRepository.findById.mockResolvedValue(active);
      warningsRepository.update.mockResolvedValue(updated);

      const result = await service.update({ warningId: WARNING_ID, content });

      expect(hazardReports.findById).toHaveBeenCalledWith(
        active.sourceReportId,
      );
      expect(warningsRepository.update).toHaveBeenCalledWith({
        id: WARNING_ID,
        expectedStatus: 'ACTIVE',
        changes: { ...content, version: 2, updatedAt: FIXED_NOW },
      });
      expect(deliveryService.deliver).toHaveBeenCalledWith(updated);
      expect(result.warning).toMatchObject({ version: 2 });
    });

    it('refuses to update a warning that is not ACTIVE', async () => {
      warningsRepository.findById.mockResolvedValue(
        buildWarningRecord({ status: 'DRAFT' }),
      );

      await expect(
        service.update({ warningId: WARNING_ID, content }),
      ).rejects.toThrow(WarningStatusConflictException);
      expectNothingSaved();
    });

    it('throws WarningNotFoundException for an unknown warning', async () => {
      warningsRepository.findById.mockResolvedValue(null);

      await expect(
        service.update({ warningId: WARNING_ID, content }),
      ).rejects.toThrow(WarningNotFoundException);
    });

    it('validates the new content in publish mode and saves nothing when invalid', async () => {
      warningsRepository.findById.mockResolvedValue(active);

      await expect(
        service.update({
          warningId: WARNING_ID,
          content: { ...content, channels: [] },
        }),
      ).rejects.toThrow(InvalidWarningException);
      expectNothingSaved();
    });

    it('reports a conflict when the warning is cancelled while updating', async () => {
      warningsRepository.findById
        .mockResolvedValueOnce(active)
        .mockResolvedValueOnce(buildWarningRecord({ status: 'CANCELLED' }));
      warningsRepository.update.mockResolvedValue(null);

      await expect(
        service.update({ warningId: WARNING_ID, content }),
      ).rejects.toThrow(WarningStatusConflictException);
      expect(deliveryService.deliver).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('cancels an ACTIVE warning with the trimmed reason', async () => {
      warningsRepository.findById.mockResolvedValue(buildWarningRecord());
      warningsRepository.update.mockResolvedValue(
        buildWarningRecord({
          status: 'CANCELLED',
          cancelledAt: FIXED_NOW,
          cancelReason: 'River level has fallen.',
        }),
      );

      const cancelled = await service.cancel({
        warningId: WARNING_ID,
        reason: '  River level has fallen.  ',
      });

      expect(warningsRepository.update).toHaveBeenCalledWith({
        id: WARNING_ID,
        expectedStatus: 'ACTIVE',
        changes: {
          status: 'CANCELLED',
          cancelledAt: FIXED_NOW,
          cancelReason: 'River level has fallen.',
        },
      });
      expect(cancelled).toMatchObject({
        status: 'CANCELLED',
        cancelledAt: FIXED_NOW.toISOString(),
      });
    });

    it('requires a reason', async () => {
      warningsRepository.findById.mockResolvedValue(buildWarningRecord());

      const error = await service
        .cancel({ warningId: WARNING_ID, reason: '   ' })
        .catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(InvalidWarningException);
      expect((error as InvalidWarningException).errors).toEqual({
        cancelReason: expect.any(String),
      });
      expect(warningsRepository.update).not.toHaveBeenCalled();
    });

    it.each(['DRAFT', 'CANCELLED'] as const)(
      'refuses to cancel a %s warning',
      async (status) => {
        warningsRepository.findById.mockResolvedValue(
          buildWarningRecord({ status }),
        );

        await expect(
          service.cancel({ warningId: WARNING_ID, reason: 'No longer needed' }),
        ).rejects.toThrow(WarningStatusConflictException);
        expect(warningsRepository.update).not.toHaveBeenCalled();
      },
    );
  });

  describe('list', () => {
    it('filters by status', async () => {
      warningsRepository.findAll.mockResolvedValue([buildWarningRecord()]);

      await expect(service.list('ACTIVE')).resolves.toEqual([
        expect.objectContaining({ id: WARNING_ID, status: 'ACTIVE' }),
      ]);
      expect(warningsRepository.findAll).toHaveBeenCalledWith({
        status: 'ACTIVE',
      });
    });

    it('lists every warning when no status is given', async () => {
      warningsRepository.findAll.mockResolvedValue([]);

      await service.list();

      expect(warningsRepository.findAll).toHaveBeenCalledWith({});
    });
  });

  it('listTargetAreas returns every district and river basin', () => {
    expect(service.listTargetAreas()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'B-KALU', kind: 'RIVER_BASIN' }),
        expect.objectContaining({ id: 'D-COLOMBO', kind: 'DISTRICT' }),
      ]),
    );
  });

  it('listVerifiedReports returns the verified reports from the lookup', async () => {
    hazardReports.findVerified.mockResolvedValue([VERIFIED_REPORT]);

    await expect(service.listVerifiedReports()).resolves.toEqual([
      VERIFIED_REPORT,
    ]);
  });

  describe('latestDeliveries', () => {
    it('returns only the records of the current version', async () => {
      warningsRepository.findById.mockResolvedValue(
        buildWarningRecord({ version: 2 }),
      );
      deliveryRecordsRepository.findByWarningVersion.mockResolvedValue([
        buildDeliveryRecord({ warningVersion: 2 }),
      ]);

      await expect(service.latestDeliveries(WARNING_ID)).resolves.toEqual([
        expect.objectContaining({ warningVersion: 2 }),
      ]);
      expect(
        deliveryRecordsRepository.findByWarningVersion,
      ).toHaveBeenCalledWith({ warningId: WARNING_ID, warningVersion: 2 });
    });

    it('throws WarningNotFoundException for an unknown warning', async () => {
      warningsRepository.findById.mockResolvedValue(null);

      await expect(service.latestDeliveries(WARNING_ID)).rejects.toThrow(
        WarningNotFoundException,
      );
    });
  });

  it('retryDelivery delegates to the delivery service and returns a DTO', async () => {
    deliveryService.retry.mockResolvedValue(
      buildDeliveryRecord({ attempts: 4 }),
    );

    await expect(service.retryDelivery('record-1')).resolves.toMatchObject({
      attempts: 4,
      lastAttemptAt: FIXED_NOW.toISOString(),
    });
    expect(deliveryService.retry).toHaveBeenCalledWith('record-1');
  });
});
