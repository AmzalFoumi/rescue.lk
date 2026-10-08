import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DeliveryRecord,
  DeliveryRecordDocument,
} from './schemas/delivery-record.schema.js';
import type {
  CreateDeliveryRecordInput,
  DeliveryRecordChanges,
  DeliveryRecordEntry,
  DeliveryRecordsRepository,
  WarningVersionRef,
} from './delivery-records.repository.interface.js';
import { INITIAL_DELIVERY_STATUS } from './warnings.constants.js';

type LeanDeliveryRecord = DeliveryRecord & { _id: Types.ObjectId };

// MongooseDeliveryRecordsRepository stores delivery records in MongoDB Atlas.
// Repository pattern: it is the only class that touches the DeliveryRecord Mongoose
// Model, and it maps documents to plain DeliveryRecordEntry objects.
// DIP: services depend on the DeliveryRecordsRepository interface; this class is bound
// to it in warnings.module.ts, so the database can change without touching services.
@Injectable()
export class MongooseDeliveryRecordsRepository implements DeliveryRecordsRepository {
  private readonly logger = new Logger(MongooseDeliveryRecordsRepository.name);

  constructor(
    @InjectModel(DeliveryRecord.name)
    private readonly model: Model<DeliveryRecordDocument>,
  ) {}

  async create(input: CreateDeliveryRecordInput): Promise<DeliveryRecordEntry> {
    const created = await this.model.create({
      ...input,
      warningId: new Types.ObjectId(input.warningId),
      status: INITIAL_DELIVERY_STATUS,
    });
    this.logger.debug(
      `Queued ${input.channel} delivery ${created.id} for warning ${input.warningId} v${input.warningVersion}`,
    );
    return this.toEntry(created.toObject());
  }

  async findById(id: string): Promise<DeliveryRecordEntry | null> {
    const found = await this.model
      .findById(id)
      .lean<LeanDeliveryRecord>()
      .exec();
    return found ? this.toEntry(found) : null;
  }

  async findByWarningVersion({
    warningId,
    warningVersion,
  }: WarningVersionRef): Promise<DeliveryRecordEntry[]> {
    const found = await this.model
      .find({ warningId: new Types.ObjectId(warningId), warningVersion })
      .lean<LeanDeliveryRecord[]>()
      .exec();
    return found.map((record) => this.toEntry(record));
  }

  async update(
    id: string,
    changes: DeliveryRecordChanges,
  ): Promise<DeliveryRecordEntry | null> {
    const updated = await this.model
      .findByIdAndUpdate(id, changes, {
        returnDocument: 'after',
        runValidators: true,
      })
      .lean<LeanDeliveryRecord>()
      .exec();
    return updated ? this.toEntry(updated) : null;
  }

  private toEntry(record: LeanDeliveryRecord): DeliveryRecordEntry {
    return {
      id: record._id.toString(),
      warningId: record.warningId.toString(),
      warningVersion: record.warningVersion,
      channel: record.channel,
      status: record.status,
      attempts: record.attempts,
      recipients: record.recipients,
      lastAttemptAt: record.lastAttemptAt,
      error: record.error,
    };
  }
}
