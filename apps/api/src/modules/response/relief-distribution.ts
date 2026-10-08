import type { Owner } from './organisation.js';

/** The relief supplies the case study names, plus a catch-all. */
export enum ReliefItem {
  Food = 'food',
  Water = 'water',
  Medicine = 'medicine',
  Other = 'other',
}

/** One delivery of relief supplies to one district. */
export interface ReliefDistributionRecord {
  id: string;
  item: ReliefItem;
  quantity: number;
  /** District id. */
  district: string;
  owner: Owner;
  distributedAt: Date;
}
