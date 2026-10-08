export const DISTRICTS_REPOSITORY = Symbol('DISTRICTS_REPOSITORY');

/** A district as the service sees it (plain data, no database types). */
export interface DistrictRecord {
  id: string;
  name: string;
  province: string;
  /** Centre of the district, used when a reporter enters a location by hand. */
  latitude: number;
  longitude: number;
}

export interface DistrictsRepository {
  /** All districts, sorted by name. */
  findAll(): Promise<DistrictRecord[]>;
}
