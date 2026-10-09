import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Shelter, ShelterDocument } from './schemas/shelter.schema.js';
import type { ShelterRecord } from './shelter.js';
import type { SheltersRepository } from './shelters.repository.interface.js';

/** The only class that talks to MongoDB for shelters. */
@Injectable()
export class MongooseSheltersRepository implements SheltersRepository {
  constructor(
    @InjectModel(Shelter.name)
    private readonly model: Model<ShelterDocument>,
  ) {}

  async findAll(district?: string): Promise<ShelterRecord[]> {
    const query = district ? { district } : {};
    const docs = await this.model.find(query).sort({ name: 1 }).exec();
    return docs.map((doc) => this.toRecord(doc));
  }

  async findById(id: string): Promise<ShelterRecord | null> {
    const doc = await this.model.findById(id).exec();
    return doc ? this.toRecord(doc) : null;
  }

  /**
   * The capacity check is part of the write: the filter only matches while the
   * new occupancy still fits, so the last places cannot be taken twice.
   */
  async changeOccupancy(
    id: string,
    people: number,
  ): Promise<ShelterRecord | null> {
    const doc = await this.model
      .findOneAndUpdate(
        {
          _id: id,
          $expr: {
            $and: [
              { $gte: [{ $add: ['$currentOccupancy', people] }, 0] },
              { $lte: [{ $add: ['$currentOccupancy', people] }, '$capacity'] },
            ],
          },
        },
        { $inc: { currentOccupancy: people } },
        { returnDocument: 'after' },
      )
      .exec();
    return doc ? this.toRecord(doc) : null;
  }

  private toRecord(doc: ShelterDocument): ShelterRecord {
    return {
      id: doc.id,
      name: doc.name,
      owner: {
        organisationId: String(doc.owner.organisationId),
        name: doc.owner.name,
        kind: doc.owner.kind,
      },
      district: String(doc.district),
      capacity: doc.capacity,
      currentOccupancy: doc.currentOccupancy,
    };
  }
}
