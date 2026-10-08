import type {
  AlertChannelType,
  WarningSeverity,
  WarningStatus,
} from '@rescue-lk/shared';

export const WARNINGS_REPOSITORY = Symbol('WARNINGS_REPOSITORY');

// Persistence-agnostic view of a stored warning, so services never see Mongoose types.
export interface WarningRecord {
  id: string;
  hazardReportId: string;
  title: string;
  message: string;
  severity: WarningSeverity;
  districts: string[];
  channels: AlertChannelType[];
  status: WarningStatus;
  issuedAt: Date;
  expiresAt: Date;
}

// New warnings always start in the default status, so it is not part of the input.
export type CreateWarningInput = Omit<WarningRecord, 'id' | 'status'>;

export interface WarningsRepository {
  create(input: CreateWarningInput): Promise<WarningRecord>;
  findById(id: string): Promise<WarningRecord | null>;
  findAll(): Promise<WarningRecord[]>;
  updateStatus(
    id: string,
    status: WarningStatus,
  ): Promise<WarningRecord | null>;
}
