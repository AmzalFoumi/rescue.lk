import type { Incident } from './schemas/incident.schema.js';

export const RESPONSE_REPOSITORY = Symbol('RESPONSE_REPOSITORY');

export interface ResponseRepository {
  findAllIncidents(): Promise<Incident[]>;
}
