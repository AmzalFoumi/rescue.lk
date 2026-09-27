import { Inject, Injectable } from '@nestjs/common';
import { HAZARD_REPORTS_REPOSITORY } from './hazard-reports.repository.interface.js';
import type { HazardReportsRepository } from './hazard-reports.repository.interface.js';

@Injectable()
export class HazardReportsService {
  constructor(
    @Inject(HAZARD_REPORTS_REPOSITORY)
    private readonly hazardReportsRepository: HazardReportsRepository,
  ) {}

  health(): { status: string; module: string } {
    return { status: 'ok', module: 'hazard-reports' };
  }

  async findAll() {
    return this.hazardReportsRepository.findAll();
  }
}
