import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { WarningStatus } from '@rescue-lk/shared';
import { Warning, WarningDocument } from './schemas/warning.schema.js';
import type {
  CreateWarningInput,
  WarningRecord,
  WarningsRepository,
} from './warnings.repository.interface.js';

type LeanWarning = Warning & { _id: Types.ObjectId };

@Injectable()
export class MongooseWarningsRepository implements WarningsRepository {
  private readonly logger = new Logger(MongooseWarningsRepository.name);

  constructor(
    @InjectModel(Warning.name) private readonly model: Model<WarningDocument>,
  ) {}

  async create(input: CreateWarningInput): Promise<WarningRecord> {
    const created = await this.model.create({
      ...input,
      hazardReportId: new Types.ObjectId(input.hazardReportId),
      districts: input.districts.map((id) => new Types.ObjectId(id)),
    });
    this.logger.debug(`Created warning ${created.id}`);
    return this.toRecord(created.toObject());
  }

  async findById(id: string): Promise<WarningRecord | null> {
    const found = await this.model.findById(id).lean<LeanWarning>().exec();
    return found ? this.toRecord(found) : null;
  }

  async findAll(): Promise<WarningRecord[]> {
    const found = await this.model.find().lean<LeanWarning[]>().exec();
    return found.map((warning) => this.toRecord(warning));
  }

  async updateStatus(
    id: string,
    status: WarningStatus,
  ): Promise<WarningRecord | null> {
    const updated = await this.model
      .findByIdAndUpdate(
        id,
        { status },
        { returnDocument: 'after', runValidators: true },
      )
      .lean<LeanWarning>()
      .exec();
    if (!updated) {
      return null;
    }
    this.logger.debug(`Warning ${id} status set to ${status}`);
    return this.toRecord(updated);
  }

  private toRecord(warning: LeanWarning): WarningRecord {
    return {
      id: warning._id.toString(),
      hazardReportId: warning.hazardReportId.toString(),
      title: warning.title,
      message: warning.message,
      severity: warning.severity,
      districts: warning.districts.map((id) => id.toString()),
      channels: warning.channels,
      status: warning.status,
      issuedAt: warning.issuedAt,
      expiresAt: warning.expiresAt,
    };
  }
}
