/**
 * A GPS position. Latitude and longitude always belong together, so they
 * travel as one value. Response coordination keeps its own copy of this type
 * rather than sharing the one in hazard reports, so the two modules stay
 * independent.
 */
export interface Location {
  latitude: number;
  longitude: number;
}
