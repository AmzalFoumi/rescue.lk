import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { ReliefDistributionRecord } from './relief-distribution.js';
import type {
  NewReliefDistribution,
  ReliefDistributionsRepository,
} from './relief-distributions.repository.interface.js';
import {
  ReliefDistribution,
  ReliefDistributionDocument,
} from './schemas/relief-distribution.schema.js';

/** The only class that talks to MongoDB for relief distributions. */
@Injectable()
export class MongooseReliefDistributionsRepository implements ReliefDistributionsRepository {
  constructor(
    @InjectModel(ReliefDistribution.name)
    private readonly model: Model<ReliefDistributionDocument>,
  ) {}

  async create(
    distribution: NewReliefDistribution,
  ): Promise<ReliefDistributionRecord> {
    return this.toRecord(await this.model.create(distribution));
  }

  async findAll(district?: string): Promise<ReliefDistributionRecord[]> {
    const query = district ? { district } : {};
    const docs = await this.model
      .find(query)
      .sort({ distributedAt: -1 })
      .exec();
    return docs.map((doc) => this.toRecord(doc));
  }

  private toRecord(doc: ReliefDistributionDocument): ReliefDistributionRecord {
    return {
      id: doc.id,
      item: doc.item,
      quantity: doc.quantity,
      district: String(doc.district),
      owner: {
        organisationId: String(doc.owner.organisationId),
        name: doc.owner.name,
        kind: doc.owner.kind,
      },
      distributedAt: doc.distributedAt,
    };
  }
}
