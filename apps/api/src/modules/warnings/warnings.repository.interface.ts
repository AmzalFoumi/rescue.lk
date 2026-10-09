import type {
  AlertChannelType,
  WarningHazardType,
  WarningSeverity,
  WarningStatus,
} from '@rescue-lk/shared';

export const WARNINGS_REPOSITORY = Symbol('WARNINGS_REPOSITORY');

// Persistence-agnostic view of a stored warning, so services never see Mongoose types.
export interface WarningRecord {
  id: string;
  sourceReportId: string;
  hazard: WarningHazardType;
  otherHazard: string;
  severity: WarningSeverity;
  areaIds: string[];
  message: string;
  instructions: string;
  channels: AlertChannelType[];
  status: WarningStatus;
  version: number;
  createdBy: string;
  createdAt: Date;
  publishedAt: Date | null;
  updatedAt: Date | null;
  cancelledAt: Date | null;
  cancelReason: string;
}

export type CreateWarningInput = Omit<WarningRecord, 'id'>;

export type WarningChanges = Partial<Omit<WarningRecord, 'id' | 'createdAt'>>;

// Optimistic guard: the update only applies while the warning is still in
// expectedStatus, so two concurrent publishes or cancels cannot both win.
export interface GuardedWarningUpdate {
  id: string;
  expectedStatus: WarningStatus;
  changes: WarningChanges;
}

export interface WarningListFilter {
  status?: WarningStatus;
}

// WarningsRepository is how services create, find, list and update warnings.
// Repository pattern: the services see only this interface and plain WarningRecords;
// Mongoose stays inside MongooseWarningsRepository.
// DIP: the high-level services depend on this abstraction, not on the database, so
// tests use an in-memory fake and the database could change without touching them.
// update() takes a status guard (GuardedWarningUpdate), so status rules hold even when
// two officers act at the same time.
export interface WarningsRepository {
  create(input: CreateWarningInput): Promise<WarningRecord>;
  findById(id: string): Promise<WarningRecord | null>;
  // Newest first (publishedAt, then createdAt).
  findAll(filter?: WarningListFilter): Promise<WarningRecord[]>;
  // Returns null when the warning is missing or no longer in expectedStatus.
  update(update: GuardedWarningUpdate): Promise<WarningRecord | null>;
}
