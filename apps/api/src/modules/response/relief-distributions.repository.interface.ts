import type { Owner } from './organisation.js';
import type {
  ReliefDistributionRecord,
  ReliefItem,
} from './relief-distribution.js';

export const RELIEF_DISTRIBUTIONS_REPOSITORY = Symbol(
  'RELIEF_DISTRIBUTIONS_REPOSITORY',
);

export interface NewReliefDistribution {
  item: ReliefItem;
  quantity: number;
  district: string;
  owner: Owner;
  distributedAt: Date;
}

export interface ReliefDistributionsRepository {
  create(
    distribution: NewReliefDistribution,
  ): Promise<ReliefDistributionRecord>;
  /** Everything distributed, or only what went to one district. */
  findAll(district?: string): Promise<ReliefDistributionRecord[]>;
}
