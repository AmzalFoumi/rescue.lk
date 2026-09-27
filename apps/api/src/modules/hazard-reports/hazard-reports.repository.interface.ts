import type { HazardReport } from './schemas/hazard-report.schema.js';

export const HAZARD_REPORTS_REPOSITORY = Symbol('HAZARD_REPORTS_REPOSITORY');

export interface HazardReportsRepository {
  findAll(): Promise<HazardReport[]>;
}
