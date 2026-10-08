import type { AlertChannelType, DeliveryStatus } from '@rescue-lk/shared';

export const DELIVERY_RECORDS_REPOSITORY = Symbol(
  'DELIVERY_RECORDS_REPOSITORY',
);

// Persistence-agnostic view of one channel's delivery outcome for a warning.
export interface DeliveryRecordEntry {
  id: string;
  warningId: string;
  channel: AlertChannelType;
  status: DeliveryStatus;
  attempts: number;
  failureReason?: string;
  lastAttemptAt?: Date;
}

// Records start as pending with zero attempts, so only the target is supplied.
export type CreateDeliveryRecordInput = Pick<
  DeliveryRecordEntry,
  'warningId' | 'channel'
>;

export type DeliveryRecordChanges = Partial<
  Pick<
    DeliveryRecordEntry,
    'status' | 'attempts' | 'failureReason' | 'lastAttemptAt'
  >
>;

export interface DeliveryRecordsRepository {
  create(input: CreateDeliveryRecordInput): Promise<DeliveryRecordEntry>;
  findByWarningId(warningId: string): Promise<DeliveryRecordEntry[]>;
  update(
    id: string,
    changes: DeliveryRecordChanges,
  ): Promise<DeliveryRecordEntry | null>;
}
