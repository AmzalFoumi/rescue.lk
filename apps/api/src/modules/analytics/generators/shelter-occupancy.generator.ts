import { Inject, Injectable } from '@nestjs/common';
import {
  SHELTER_OCCUPANCY_PORT,
  type ShelterOccupancyPort,
} from '../ports/shelter-occupancy.port.js';
import type { AnalyticsFilters } from '../domain/analytics-filters.js';
import type { ReportContent } from '../domain/report-content.js';
import type { ReportGenerator } from './report-generator.interface.js';

function getShelterStatus(occupied: number, capacity: number): string {
  if (capacity <= 0) return 'Unknown';
  const ratio = occupied / capacity;
  if (ratio >= 0.9) return 'Critical';
  if (ratio >= 0.75) return 'Near full';
  return 'Available';
}

@Injectable()
export class ShelterOccupancyGenerator implements ReportGenerator {
  readonly type = 'SHELTER_OCCUPANCY' as const;

  constructor(
    @Inject(SHELTER_OCCUPANCY_PORT)
    private readonly source: ShelterOccupancyPort,
  ) {}

  async generate(filters: AnalyticsFilters): Promise<ReportContent> {
    const entries = await this.source.findShelterOccupancy(filters);

    return {
      title: 'Shelter Occupancy',
      description: 'Shelter capacity and occupancy, by district.',
      columns: [
        { key: 'district', label: 'District' },
        { key: 'shelters', label: 'Shelters', align: 'right' },
        { key: 'capacity', label: 'Capacity', align: 'right' },
        { key: 'occupied', label: 'Occupied', align: 'right' },
        { key: 'available', label: 'Available', align: 'right' },
        { key: 'status', label: 'Status' },
      ],
      rows: entries.map((e) => ({
        district: e.district,
        shelters: e.shelters,
        capacity: e.capacity,
        occupied: e.occupied,
        available: Math.max(e.capacity - e.occupied, 0),
        status: getShelterStatus(e.occupied, e.capacity),
      })),
    };
  }
}
