import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Warning, WarningDocument } from './schemas/warning.schema.js';
import type { WarningsRepository } from './warnings.repository.interface.js';

@Injectable()
export class MongooseWarningsRepository implements WarningsRepository {
  constructor(@InjectModel(Warning.name) private readonly model: Model<WarningDocument>) {}

  async findAll(): Promise<Warning[]> {
    return this.model.find().exec();
  }
}
