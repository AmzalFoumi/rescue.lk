import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Owner } from './organisation.js';
import type {
  ReliefDistributionRecord,
  ReliefItem,
} from './relief-distribution.js';
import { RELIEF_DISTRIBUTIONS_REPOSITORY } from './relief-distributions.repository.interface.js';
import type { ReliefDistributionsRepository } from './relief-distributions.repository.interface.js';

/** What the officer records after supplies go out. */
export interface ReliefHandout {
  item: ReliefItem;
  quantity: number;
  district: string;
  owner: Owner;
}

/**
 * Allocate Relief Resources: food, water and medicine are logged as they are
 * distributed, with the district and the organisation that supplied them.
 */
@Injectable()
export class ReliefDistributionService {
  private readonly logger = new Logger(ReliefDistributionService.name);

  constructor(
    @Inject(RELIEF_DISTRIBUTIONS_REPOSITORY)
    private readonly distributions: ReliefDistributionsRepository,
  ) {}

  async log(handout: ReliefHandout): Promise<ReliefDistributionRecord> {
    const record = await this.distributions.create({
      ...handout,
      distributedAt: new Date(),
    });
    this.logger.log(
      `${handout.quantity} ${handout.item} distributed in district ${handout.district}`,
    );
    return record;
  }

  list(district?: string): Promise<ReliefDistributionRecord[]> {
    return this.distributions.findAll(district);
  }
}
