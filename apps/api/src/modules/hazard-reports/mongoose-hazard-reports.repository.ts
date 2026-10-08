import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  HazardReport,
  HazardReportDocument,
} from './schemas/hazard-report.schema.js';
import type {
  HazardReportsRepository,
  NewHazardReport,
  StatusChange,
} from './hazard-reports.repository.interface.js';
import type { HazardReportStatus } from './hazard-report-status.js';
import type { HazardType } from './hazard-type.js';

@Injectable()
export class MongooseHazardReportsRepository implements HazardReportsRepository {
  constructor(
    @InjectModel(HazardReport.name)
    private readonly model: Model<HazardReportDocument>,
  ) {}

  create(report: NewHazardReport): Promise<HazardReportDocument> {
    return this.model.create(report);
  }

  findById(id: string): Promise<HazardReportDocument | null> {
    return this.model.findById(id).exec();
  }

  findByStatus(status: HazardReportStatus): Promise<HazardReportDocument[]> {
    return this.model.find({ status }).sort({ capturedAt: 1 }).exec();
  }

  findByTypeBetween(
    type: HazardType,
    from: Date,
    to: Date,
  ): Promise<HazardReportDocument[]> {
    return this.model
      .find({ hazardType: type, capturedAt: { $gte: from, $lte: to } })
      .exec();
  }

  updateStatus(
    id: string,
    change: StatusChange,
  ): Promise<HazardReportDocument | null> {
    return this.model.findByIdAndUpdate(id, change, { new: true }).exec();
  }
}
