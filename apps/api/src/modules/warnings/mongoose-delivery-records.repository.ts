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
} from './delivery-records.repository.interface.js';

type LeanDeliveryRecord = DeliveryRecord & { _id: Types.ObjectId };

@Injectable()
export class MongooseDeliveryRecordsRepository implements DeliveryRecordsRepository {
  private readonly logger = new Logger(MongooseDeliveryRecordsRepository.name);

  constructor(
    @InjectModel(DeliveryRecord.name)
    private readonly model: Model<DeliveryRecordDocument>,
  ) {}

  async create(input: CreateDeliveryRecordInput): Promise<DeliveryRecordEntry> {
    const created = await this.model.create({
      warningId: new Types.ObjectId(input.warningId),
      channel: input.channel,
    });
    this.logger.debug(
      `Created ${input.channel} delivery record ${created.id} for warning ${input.warningId}`,
    );
    return this.toEntry(created.toObject());
  }

  async findByWarningId(warningId: string): Promise<DeliveryRecordEntry[]> {
    const found = await this.model
      .find({ warningId: new Types.ObjectId(warningId) })
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
      channel: record.channel,
      status: record.status,
      attempts: record.attempts,
      failureReason: record.failureReason,
      lastAttemptAt: record.lastAttemptAt,
    };
  }
}
