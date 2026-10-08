import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  District,
  DistrictDocument,
} from '../../database/schemas/district.schema.js';
import type {
  DistrictRecord,
  DistrictsRepository,
} from './districts.repository.interface.js';

/** The only class that talks to MongoDB for districts. */
@Injectable()
export class MongooseDistrictsRepository implements DistrictsRepository {
  constructor(
    @InjectModel(District.name)
    private readonly model: Model<DistrictDocument>,
  ) {}

  async findAll(): Promise<DistrictRecord[]> {
    const docs = await this.model.find().sort({ name: 1 }).exec();
    return docs.map((doc) => ({
      id: doc.id,
      name: doc.name,
      province: doc.province,
      latitude: doc.latitude,
      longitude: doc.longitude,
    }));
  }
}
