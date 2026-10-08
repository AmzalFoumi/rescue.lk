import type { AlertChannelType, DeliveryStatus } from '@rescue-lk/shared';

export const DELIVERY_RECORDS_REPOSITORY = Symbol(
  'DELIVERY_RECORDS_REPOSITORY',
);

// Persistence-agnostic view of one channel's delivery of one warning version.
export interface DeliveryRecordEntry {
  id: string;
  warningId: string;
  warningVersion: number;
  channel: AlertChannelType;
  status: DeliveryStatus;
  attempts: number;
  recipients: number;
  lastAttemptAt: Date | null;
  error: string;
}

// Records start QUEUED with no attempts, recipients or error.
export type CreateDeliveryRecordInput = Pick<
  DeliveryRecordEntry,
  'warningId' | 'warningVersion' | 'channel'
>;

export type DeliveryRecordChanges = Partial<
  Pick<
    DeliveryRecordEntry,
    'status' | 'attempts' | 'recipients' | 'lastAttemptAt' | 'error'
  >
>;

export interface WarningVersionRef {
  warningId: string;
  warningVersion: number;
}

// DeliveryRecordsRepository is how services save and read delivery records (one per
// channel per warning version).
// Repository pattern + DIP: services depend on this interface, never on Mongoose,
// which stays inside MongooseDeliveryRecordsRepository; tests use a fake.
// ISP: it offers only the four operations UC1 needs (create, findById,
// findByWarningVersion, update), so a fake or a new database adapter stays small.
export interface DeliveryRecordsRepository {
  create(input: CreateDeliveryRecordInput): Promise<DeliveryRecordEntry>;
  findById(id: string): Promise<DeliveryRecordEntry | null>;
  findByWarningVersion(ref: WarningVersionRef): Promise<DeliveryRecordEntry[]>;
  update(
    id: string,
    changes: DeliveryRecordChanges,
  ): Promise<DeliveryRecordEntry | null>;
}
