import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { DISTRICTS_REPOSITORY } from '../../districts/districts.repository.interface.js';
import type { DistrictsRepository } from '../../districts/districts.repository.interface.js';

export const UNKNOWN_DISTRICT_NAME = 'Unknown district';

@Injectable()
export class DistrictNameResolver implements OnModuleInit {
  private districtMap = new Map<string, string>();

  constructor(
    @Inject(DISTRICTS_REPOSITORY)
    private readonly districtsRepo: DistrictsRepository,
  ) {}

  async onModuleInit() {
    await this.refresh();
  }

  async refresh() {
    const districts = await this.districtsRepo.findAll();
    for (const d of districts) {
      this.districtMap.set(d.id.toString(), d.name);
    }
  }

  resolve(id: string): string {
    return this.districtMap.get(id.toString()) ?? UNKNOWN_DISTRICT_NAME;
  }
}
