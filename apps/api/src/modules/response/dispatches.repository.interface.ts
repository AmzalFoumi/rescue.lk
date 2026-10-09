import type { DispatchRecord } from './dispatch-record.js';
import type { Owner } from './organisation.js';

export const DISPATCHES_REPOSITORY = Symbol('DISPATCHES_REPOSITORY');

export interface NewDispatch {
  reportId: string;
  teamId: string;
  teamName: string;
  owner: Owner;
  district: string;
  dispatchedBy: string;
  dispatchedAt: Date;
}

export interface DispatchesRepository {
  create(dispatch: NewDispatch): Promise<DispatchRecord>;
  findByReport(reportId: string): Promise<DispatchRecord[]>;
  /** How many teams were dispatched to each of these reports. */
  countByReport(reportIds: string[]): Promise<Record<string, number>>;
}
