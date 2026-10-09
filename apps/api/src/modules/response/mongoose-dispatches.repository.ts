import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { DispatchRecord } from './dispatch-record.js';
import type {
  DispatchesRepository,
  NewDispatch,
} from './dispatches.repository.interface.js';
import { Dispatch, DispatchDocument } from './schemas/dispatch.schema.js';

/** The only class that talks to MongoDB for dispatches. */
@Injectable()
export class MongooseDispatchesRepository implements DispatchesRepository {
  constructor(
    @InjectModel(Dispatch.name)
    private readonly model: Model<DispatchDocument>,
  ) {}

  async create(dispatch: NewDispatch): Promise<DispatchRecord> {
    return this.toRecord(await this.model.create(dispatch));
  }

  async findByReport(reportId: string): Promise<DispatchRecord[]> {
    const docs = await this.model
      .find({ reportId })
      .sort({ dispatchedAt: -1 })
      .exec();
    return docs.map((doc) => this.toRecord(doc));
  }

  async countByReport(reportIds: string[]): Promise<Record<string, number>> {
    if (reportIds.length === 0) {
      return {};
    }
    const rows = await this.model
      .aggregate<{ _id: Types.ObjectId; count: number }>([
        {
          $match: {
            reportId: { $in: reportIds.map((id) => new Types.ObjectId(id)) },
          },
        },
        { $group: { _id: '$reportId', count: { $sum: 1 } } },
      ])
      .exec();
    return Object.fromEntries(rows.map((row) => [String(row._id), row.count]));
  }

  private toRecord(doc: DispatchDocument): DispatchRecord {
    return {
      id: doc.id,
      reportId: String(doc.reportId),
      teamId: String(doc.teamId),
      teamName: doc.teamName,
      owner: {
        organisationId: String(doc.owner.organisationId),
        name: doc.owner.name,
        kind: doc.owner.kind,
      },
      district: String(doc.district),
      dispatchedBy: doc.dispatchedBy,
      dispatchedAt: doc.dispatchedAt,
    };
  }
}
