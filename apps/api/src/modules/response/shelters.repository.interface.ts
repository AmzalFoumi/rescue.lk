import type { ShelterRecord } from './shelter.js';

export const SHELTERS_REPOSITORY = Symbol('SHELTERS_REPOSITORY');

export interface SheltersRepository {
  /** Every shelter, or only those of one district. */
  findAll(district?: string): Promise<ShelterRecord[]>;
  findById(id: string): Promise<ShelterRecord | null>;
  /**
   * Adds people to a shelter, or removes them with a negative number, only if
   * the result still fits between zero and the capacity. Returns null when it
   * does not, so a full shelter can never be overfilled.
   */
  changeOccupancy(id: string, people: number): Promise<ShelterRecord | null>;
}
