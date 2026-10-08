/**
 * A GPS position (the location of a hazard report in the class diagram).
 * Latitude and longitude always belong together, so they travel as one value.
 */
export interface Location {
  latitude: number;
  longitude: number;
}
