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
import { HAZARD_REPORT_LOOKUP } from './hazard-report-lookup/hazard-report-lookup.interface.js';
import { InMemoryHazardReportLookup } from './hazard-report-lookup/in-memory-hazard-report-lookup.js';
import { WarningValidator } from './validation/warning.validator.js';
import { ALERT_CHANNELS } from './channels/alert-channel.interface.js';
import type { AlertChannel } from './channels/alert-channel.interface.js';
import { PushChannel } from './channels/push.channel.js';
import { SmsChannel } from './channels/sms.channel.js';
import { SirenChannel } from './channels/siren.channel.js';
import { ChannelRegistry } from './channels/channel.registry.js';
import { RetryPolicy } from './delivery/retry.policy.js';
import { WarningDeliveryService } from './delivery/warning-delivery.service.js';
import { CLOCK, SystemClock } from './domain/clock.js';
import { TARGET_AREA_CATALOG } from './target-areas/target-area-catalog.interface.js';
import { InMemoryTargetAreaCatalog } from './target-areas/in-memory-target-area-catalog.js';

// Adding a channel (e.g. email) means one new class here; nothing else changes.
const CHANNEL_IMPLEMENTATIONS = [SmsChannel, PushChannel, SirenChannel];

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
    // Replace with the UC2 adapter once hazard-reports exposes verified reports.
    { provide: HAZARD_REPORT_LOOKUP, useClass: InMemoryHazardReportLookup },
    { provide: TARGET_AREA_CATALOG, useClass: InMemoryTargetAreaCatalog },
    WarningValidator,
    ...CHANNEL_IMPLEMENTATIONS,
    {
      provide: ALERT_CHANNELS,
      useFactory: (...channels: AlertChannel[]) => channels,
      inject: CHANNEL_IMPLEMENTATIONS,
    },
    ChannelRegistry,
    RetryPolicy,
    WarningDeliveryService,
    { provide: CLOCK, useClass: SystemClock },
  ],
})
export class WarningsModule {}
