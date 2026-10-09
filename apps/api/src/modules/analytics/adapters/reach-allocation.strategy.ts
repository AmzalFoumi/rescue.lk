import { Injectable } from '@nestjs/common';

export const REACH_ALLOCATION_STRATEGY = Symbol('REACH_ALLOCATION_STRATEGY');

export interface ReachAllocationStrategy {
  allocate(total: number, districts: string[]): Map<string, number>;
}

@Injectable()
export class EqualSplitReachAllocation implements ReachAllocationStrategy {
  allocate(total: number, districts: string[]): Map<string, number> {
    const map = new Map<string, number>();
    if (districts.length === 0 || total === 0) {
      for (const d of districts) map.set(d, 0);
      return map;
    }
    const base = Math.floor(total / districts.length);
    let remainder = total % districts.length;

    for (const d of districts) {
      const extra = remainder > 0 ? 1 : 0;
      map.set(d, base + extra);
      remainder--;
    }
    return map;
  }
}
