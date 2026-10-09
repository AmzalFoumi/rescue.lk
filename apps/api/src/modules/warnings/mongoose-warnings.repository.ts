import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Warning, WarningDocument } from './schemas/warning.schema.js';
import type {
  CreateWarningInput,
  GuardedWarningUpdate,
  WarningListFilter,
  WarningRecord,
  WarningsRepository,
} from './warnings.repository.interface.js';

type LeanWarning = Warning & { _id: Types.ObjectId };

const NEWEST_FIRST = { publishedAt: -1, createdAt: -1 } as const;

// MongooseWarningsRepository stores warnings in MongoDB Atlas.
// Repository pattern: it is the only class that touches the Warning Mongoose Model,
// and it turns documents into plain WarningRecords so no Mongoose type leaks out.
// DIP: services depend on the WarningsRepository interface; this class is bound to it
// in warnings.module.ts, so replacing the database changes only this file and that
// binding. LSP: it can stand in for any other WarningsRepository, e.g. the test fake.
@Injectable()
export class MongooseWarningsRepository implements WarningsRepository {
  private readonly logger = new Logger(MongooseWarningsRepository.name);

  constructor(
    @InjectModel(Warning.name) private readonly model: Model<WarningDocument>,
  ) {}

  async create(input: CreateWarningInput): Promise<WarningRecord> {
    const created = await this.model.create({
      ...input,
      sourceReportId: new Types.ObjectId(input.sourceReportId),
    });
    this.logger.debug(`Created ${input.status} warning ${created.id}`);
    return this.toRecord(created.toObject());
  }

  async findById(id: string): Promise<WarningRecord | null> {
    const found = await this.model.findById(id).lean<LeanWarning>().exec();
    return found ? this.toRecord(found) : null;
  }

  async findAll(filter: WarningListFilter = {}): Promise<WarningRecord[]> {
    const query = filter.status ? { status: filter.status } : {};
    const found = await this.model
      .find(query)
      .sort(NEWEST_FIRST)
      .lean<LeanWarning[]>()
      .exec();
    return found.map((warning) => this.toRecord(warning));
  }

  // Status guard: expectedStatus is part of the filter, so the check and the write are
  // one atomic step; if two officers act at once only one succeeds (null = refused).
  async update({
    id,
    expectedStatus,
    changes,
  }: GuardedWarningUpdate): Promise<WarningRecord | null> {
    const updated = await this.model
      .findOneAndUpdate({ _id: id, status: expectedStatus }, changes, {
        returnDocument: 'after',
        runValidators: true,
      })
      .lean<LeanWarning>()
      .exec();
    if (!updated) {
      return null;
    }
    this.logger.debug(`Updated warning ${id} (was ${expectedStatus})`);
    return this.toRecord(updated);
  }

  private toRecord(warning: LeanWarning): WarningRecord {
    return {
      id: warning._id.toString(),
      sourceReportId: warning.sourceReportId.toString(),
      hazard: warning.hazard,
      otherHazard: warning.otherHazard,
      severity: warning.severity,
      areaIds: [...warning.areaIds],
      message: warning.message,
      instructions: warning.instructions,
      channels: [...warning.channels],
      status: warning.status,
      version: warning.version,
      createdBy: warning.createdBy,
      createdAt: warning.createdAt,
      publishedAt: warning.publishedAt,
      updatedAt: warning.updatedAt,
      cancelledAt: warning.cancelledAt,
      cancelReason: warning.cancelReason,
    };
  }
}
