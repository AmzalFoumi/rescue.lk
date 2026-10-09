import type { WarningRecord } from '../../warnings/warnings.repository.interface.js';
import type { DeliveryRecordEntry } from '../../warnings/delivery-records.repository.interface.js';
import type { ShelterRecord } from '../../response/shelter.js';
import type { ReliefDistributionRecord } from '../../response/relief-distribution.js';
import { ReliefItem } from '../../response/relief-distribution.js';
import type { OrganisationKind } from '../../response/organisation.js';

export function buildWarning(
  overrides?: Partial<WarningRecord>,
): WarningRecord {
  return {
    id: 'w1',
    sourceReportId: 'r1',
    hazard: 'flood',
    otherHazard: '',
    severity: 'HIGH',
    areaIds: ['D-COLOMBO'],
    message: 'Test',
    instructions: 'Test',
    channels: ['SMS'],
    status: 'ACTIVE',
    version: 1,
    createdBy: 'test',
    createdAt: new Date('2026-10-01'),
    publishedAt: new Date('2026-10-01'),
    updatedAt: null,
    cancelledAt: null,
    cancelReason: '',
    ...overrides,
  };
}

export function buildDeliveryRecord(
  overrides?: Partial<DeliveryRecordEntry>,
): DeliveryRecordEntry {
  return {
    id: 'd1',
    warningId: 'w1',
    warningVersion: 1,
    channel: 'SMS',
    status: 'SENT',
    attempts: 1,
    recipients: 100,
    lastAttemptAt: new Date('2026-10-01'),
    error: '',
    ...overrides,
  };
}

export function buildShelter(
  overrides?: Partial<ShelterRecord>,
): ShelterRecord {
  return {
    id: 's1',
    name: 'Test Shelter',
    owner: {
      name: 'Gov',
      kind: 'government' as OrganisationKind,
      organisationId: 'org1',
    },
    district: 'dist1',
    capacity: 100,
    currentOccupancy: 0,
    ...overrides,
  };
}

export function buildReliefDistribution(
  overrides?: Partial<ReliefDistributionRecord>,
): ReliefDistributionRecord {
  return {
    id: 'r1',
    item: ReliefItem.Food,
    quantity: 50,
    district: 'dist1',
    owner: {
      name: 'Gov',
      kind: 'government' as OrganisationKind,
      organisationId: 'org1',
    },
    distributedAt: new Date('2026-10-01'),
    ...overrides,
  };
}
