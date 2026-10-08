import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  District,
  DistrictSchema,
} from '../../database/schemas/district.schema.js';
import { DistrictsController } from './districts.controller.js';
import { DISTRICTS_REPOSITORY } from './districts.repository.interface.js';
import { DistrictsService } from './districts.service.js';
import { MongooseDistrictsRepository } from './mongoose-districts.repository.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: District.name, schema: DistrictSchema },
    ]),
  ],
  controllers: [DistrictsController],
  providers: [
    DistrictsService,
    { provide: DISTRICTS_REPOSITORY, useClass: MongooseDistrictsRepository },
  ],
})
export class DistrictsModule {}
