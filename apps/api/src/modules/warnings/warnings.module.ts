import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WarningsController } from './warnings.controller.js';
import { WarningsService } from './warnings.service.js';
import { MongooseWarningsRepository } from './mongoose-warnings.repository.js';
import { WARNINGS_REPOSITORY } from './warnings.repository.interface.js';
import { MongooseDeliveryRecordsRepository } from './mongoose-delivery-records.repository.js';
import { DELIVERY_RECORDS_REPOSITORY } from './delivery-records.repository.interface.js';
import { Warning, WarningSchema } from './schemas/warning.schema.js';
import {
  DeliveryRecord,
  DeliveryRecordSchema,
} from './schemas/delivery-record.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Warning.name, schema: WarningSchema },
      { name: DeliveryRecord.name, schema: DeliveryRecordSchema },
    ]),
  ],
  controllers: [WarningsController],
  providers: [
    WarningsService,
    { provide: WARNINGS_REPOSITORY, useClass: MongooseWarningsRepository },
    {
      provide: DELIVERY_RECORDS_REPOSITORY,
      useClass: MongooseDeliveryRecordsRepository,
    },
  ],
})
export class WarningsModule {}
