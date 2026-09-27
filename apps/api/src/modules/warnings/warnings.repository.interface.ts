import type { Warning } from './schemas/warning.schema.js';

export const WARNINGS_REPOSITORY = Symbol('WARNINGS_REPOSITORY');

export interface WarningsRepository {
  findAll(): Promise<Warning[]>;
}
