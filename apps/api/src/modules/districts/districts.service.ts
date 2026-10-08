import { Inject, Injectable } from '@nestjs/common';
import { DISTRICTS_REPOSITORY } from './districts.repository.interface.js';
import type {
  DistrictRecord,
  DistrictsRepository,
} from './districts.repository.interface.js';

@Injectable()
export class DistrictsService {
  constructor(
    @Inject(DISTRICTS_REPOSITORY)
    private readonly repository: DistrictsRepository,
  ) {}

  /** The districts a reporter can choose from, sorted by name. */
  list(): Promise<DistrictRecord[]> {
    return this.repository.findAll();
  }
}
