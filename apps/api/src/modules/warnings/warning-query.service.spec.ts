import { Test } from '@nestjs/testing';
import { describe, beforeEach, it, expect, vi, type Mocked } from 'vitest';
import type { AlertChannelType } from '@rescue-lk/shared';
import { WarningQueryService } from './warning-query.service.js';
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
import { ChannelRegistry } from './channels/channel.registry.js';
import type { AlertChannel } from './channels/alert-channel.interface.js';
import { WarningNotFoundException } from './exceptions/warning-not-found.exception.js';
import {
  VERIFIED_REPORT,
  WARNING_ID,
  buildDeliveryRecord,
  buildWarningRecord,
} from './testing/warning.fixtures.js';

// Each fake channel reaches this many recipients per district.
const REACH_PER_DISTRICT = { SMS: 100, PUSH: 40, SIREN: 2 } as const;

const fakeChannel = (type: AlertChannelType): AlertChannel => ({
  type,
  estimateRecipients: (districts) =>
    districts.length * REACH_PER_DISTRICT[type],
  send: () => Promise.resolve({ success: true, recipients: 1 }),
});

describe('WarningQueryService', () => {
  let service: WarningQueryService;
  let warningsRepository: Mocked<WarningsRepository>;
  let deliveryRecordsRepository: Mocked<DeliveryRecordsRepository>;
  let hazardReports: Mocked<HazardReportLookup>;

  beforeEach(async () => {
    warningsRepository = {
      create: vi.fn(),
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
    hazardReports = { findById: vi.fn(), findVerified: vi.fn() };

    const module = await Test.createTestingModule({
      providers: [
        WarningQueryService,
        { provide: WARNINGS_REPOSITORY, useValue: warningsRepository },
        {
          provide: DELIVERY_RECORDS_REPOSITORY,
          useValue: deliveryRecordsRepository,
        },
        { provide: HAZARD_REPORT_LOOKUP, useValue: hazardReports },
        { provide: TARGET_AREA_CATALOG, useClass: InMemoryTargetAreaCatalog },
        // Only SMS and PUSH are registered.
        {
          provide: ChannelRegistry,
          useValue: new ChannelRegistry([
            fakeChannel('SMS'),
            fakeChannel('PUSH'),
          ]),
        },
      ],
    }).compile();
    service = module.get(WarningQueryService);
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

  describe('estimateReach', () => {
    it('estimates each registered channel for the districts the areas cover', () => {
      expect(service.estimateReach(['B-KALU', 'D-RATNAPURA'])).toEqual({
        districts: ['Ratnapura', 'Kalutara'],
        channels: [
          { channel: 'SMS', recipients: 2 * REACH_PER_DISTRICT.SMS },
          { channel: 'PUSH', recipients: 2 * REACH_PER_DISTRICT.PUSH },
        ],
      });
    });

    it('reaches nobody when no area is selected', () => {
      expect(service.estimateReach([])).toEqual({
        districts: [],
        channels: [
          { channel: 'SMS', recipients: 0 },
          { channel: 'PUSH', recipients: 0 },
        ],
      });
    });
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
});
