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
    status: 'verified',
    description: 'Kelani River overflowing near Kaduwela',
  },
  {
    id: '665f1b2c9d3e4a00000000a2',
    hazardType: 'LANDSLIDE',
    district: '665f1b2c9d3e4a00000000d2',
    status: 'verified',
    description: 'Cracks and soil movement on slopes above Haldummulla',
  },
  {
    id: '665f1b2c9d3e4a00000000a3',
    hazardType: 'ROAD_BLOCKAGE',
    district: '665f1b2c9d3e4a00000000d3',
    status: 'verified',
    description: 'Fallen trees blocking the A9 road near Vavuniya',
  },
  {
    id: '665f1b2c9d3e4a00000000a4',
    hazardType: 'FIRE',
    district: '665f1b2c9d3e4a00000000d4',
    status: 'pending',
    description:
      'Grass fire reported near Anuradhapura (awaiting verification)',
  },
];

const isVerified = (
  report: HazardReportSummary,
): report is VerifiedHazardReportDto => report.status === 'verified';

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
