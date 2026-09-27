import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HazardReport, HazardReportDocument } from './schemas/hazard-report.schema.js';
import type { HazardReportsRepository } from './hazard-reports.repository.interface.js';

@Injectable()
export class MongooseHazardReportsRepository implements HazardReportsRepository {
  constructor(
    @InjectModel(HazardReport.name) private readonly model: Model<HazardReportDocument>,
  ) {}

  async findAll(): Promise<HazardReport[]> {
    return this.model.find().exec();
  }
}
