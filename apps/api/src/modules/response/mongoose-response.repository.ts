import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Incident, IncidentDocument } from './schemas/incident.schema.js';
import type { ResponseRepository } from './response.repository.interface.js';

@Injectable()
export class MongooseResponseRepository implements ResponseRepository {
  constructor(@InjectModel(Incident.name) private readonly incidentModel: Model<IncidentDocument>) {}

  async findAllIncidents(): Promise<Incident[]> {
    return this.incidentModel.find().exec();
  }
}
