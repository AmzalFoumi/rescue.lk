import { Injectable } from '@nestjs/common';
import type { VerifiedHazardReportDto } from '@rescue-lk/shared';
import type {
  HazardReportLookup,
  HazardReportSummary,
} from './hazard-report-lookup.interface.js';

// TEMPORARY STUB - replace with UC2 adapter once the hazard-reports module
// exposes verified reports. Only the HAZARD_REPORT_LOOKUP binding in
// warnings.module.ts needs to change; nothing that depends on the port does.
const STUB_REPORTS: readonly HazardReportSummary[] = [
  {
    id: '665f1b2c9d3e4a00000000a1',
    hazardType: 'FLOOD',
    district: '665f1b2c9d3e4a00000000d1',
    districtName: 'Ratnapura',
    place: 'Ratnapura town',
    reporter: 'Nimal Perera',
    status: 'verified',
    description:
      'Kalu Ganga overflowing into low-lying roads near the bus stand',
    submittedAt: '2026-10-08T03:55:00.000Z',
    verifiedAt: '2026-10-08T04:20:00.000Z',
    verifiedBy: 'K. Jayawardena',
  },
  {
    id: '665f1b2c9d3e4a00000000a2',
    hazardType: 'LANDSLIDE',
    district: '665f1b2c9d3e4a00000000d2',
    districtName: 'Badulla',
    place: 'Haldummulla',
    reporter: 'Shanthi Kumari',
    status: 'verified',
    description:
      'Cracks and soil movement on slopes above the tea estate line rooms',
    submittedAt: '2026-10-08T02:40:00.000Z',
    verifiedAt: '2026-10-08T03:15:00.000Z',
    verifiedBy: 'K. Jayawardena',
  },
  {
    id: '665f1b2c9d3e4a00000000a3',
    hazardType: 'ROAD_BLOCKAGE',
    district: '665f1b2c9d3e4a00000000d3',
    districtName: 'Kegalle',
    place: 'Mawanella',
    reporter: 'Ruwan Silva',
    status: 'verified',
    description: 'Fallen trees blocking the Colombo-Kandy road near Mawanella',
    submittedAt: '2026-10-08T01:05:00.000Z',
    verifiedAt: '2026-10-08T01:30:00.000Z',
    verifiedBy: 'K. Jayawardena',
  },
  {
    id: '665f1b2c9d3e4a00000000a4',
    hazardType: 'FIRE',
    district: '665f1b2c9d3e4a00000000d4',
    districtName: 'Anuradhapura',
    place: 'Mihintale',
    reporter: 'Fathima Rizvi',
    status: 'pending_verification',
    description: 'Grass fire reported near the reservoir bund',
    submittedAt: '2026-10-08T05:10:00.000Z',
    verifiedAt: null,
    verifiedBy: null,
  },
];

const isVerified = (
  report: HazardReportSummary,
): report is VerifiedHazardReportDto =>
  report.status === 'verified' &&
  report.verifiedAt !== null &&
  report.verifiedBy !== null;

// InMemoryHazardReportLookup serves a fixed set of hazard reports until the UC2
// adapter exists.
// Adapter (stub) for the HazardReportLookup port. LSP: any HazardReportLookup can
// replace it, so swapping in the UC2 adapter needs no change to the services.
// It includes reports that are not verified, so the "report not verified" rule can be
// shown and tested.
@Injectable()
export class InMemoryHazardReportLookup implements HazardReportLookup {
  findById(id: string): Promise<HazardReportSummary | null> {
    const report = STUB_REPORTS.find((candidate) => candidate.id === id);
    return Promise.resolve(report ?? null);
  }

  findVerified(): Promise<VerifiedHazardReportDto[]> {
    return Promise.resolve(STUB_REPORTS.filter(isVerified));
  }
}
