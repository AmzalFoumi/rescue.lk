import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { WarningsController } from './warnings.controller.js';
import { WarningsService } from './warnings.service.js';
import { WarningQueryService } from './warning-query.service.js';
import { MongooseWarningsRepository } from './mongoose-warnings.repository.js';
import { WARNINGS_REPOSITORY } from './warnings.repository.interface.js';
import { MongooseDeliveryRecordsRepository } from './mongoose-delivery-records.repository.js';
import { DELIVERY_RECORDS_REPOSITORY } from './delivery-records.repository.interface.js';
import {
  District,
  DistrictSchema,
} from '../../database/schemas/district.schema.js';
import {
  HazardReport,
  HazardReportSchema,
} from '../hazard-reports/schemas/hazard-report.schema.js';
import { Warning, WarningSchema } from './schemas/warning.schema.js';
import {
  DeliveryRecord,
  DeliveryRecordSchema,
} from './schemas/delivery-record.schema.js';
import { HAZARD_REPORT_LOOKUP } from './hazard-report-lookup/hazard-report-lookup.interface.js';
import { MongooseHazardReportLookup } from './hazard-report-lookup/mongoose-hazard-report-lookup.repository.js';
import { WarningValidator } from './validation/warning.validator.js';
import { ALERT_CHANNELS } from './channels/alert-channel.interface.js';
import type { AlertChannel } from './channels/alert-channel.interface.js';
import { PushChannel } from './channels/push.channel.js';
import { SmsChannel } from './channels/sms.channel.js';
import { SirenChannel } from './channels/siren.channel.js';
import { ChannelRegistry } from './channels/channel.registry.js';
import {
  parseChannelList,
  withDemoFailures,
} from './channels/demo-failures.js';
import { RetryPolicy } from './delivery/retry.policy.js';
import { WarningDeliveryService } from './delivery/warning-delivery.service.js';
import { CLOCK, SystemClock } from './domain/clock.js';
import { TARGET_AREA_CATALOG } from './target-areas/target-area-catalog.interface.js';
import { InMemoryTargetAreaCatalog } from './target-areas/in-memory-target-area-catalog.js';

// OCP: adding a channel (e.g. email) means one new class in this list; nothing else
// changes.
const CHANNEL_IMPLEMENTATIONS = [SmsChannel, PushChannel, SirenChannel];

// WarningsModule wires UC1 together.
// Composition root (DIP): it is the only place that binds each interface token to a
// real class (repositories, the hazard report lookup, the area catalog, the clock and
// the channel list). Everything else depends on the interfaces.
// So swapping an adapter, or adding a channel, changes only this
// file (OCP).
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Warning.name, schema: WarningSchema },
      { name: DeliveryRecord.name, schema: DeliveryRecordSchema },
      // Read only: UC1 looks up verified reports and district names.
      { name: HazardReport.name, schema: HazardReportSchema },
      { name: District.name, schema: DistrictSchema },
    ]),
  ],
  controllers: [WarningsController],
  providers: [
    WarningsService,
    WarningQueryService,
    { provide: WARNINGS_REPOSITORY, useClass: MongooseWarningsRepository },
    {
      provide: DELIVERY_RECORDS_REPOSITORY,
      useClass: MongooseDeliveryRecordsRepository,
    },
    { provide: HAZARD_REPORT_LOOKUP, useClass: MongooseHazardReportLookup },
    { provide: TARGET_AREA_CATALOG, useClass: InMemoryTargetAreaCatalog },
    WarningValidator,
    ...CHANNEL_IMPLEMENTATIONS,
    {
      provide: ALERT_CHANNELS,
      // Factory provider: builds the channel list at startup. MOCK_FAIL_FIRST_ATTEMPT_CHANNELS
      // (demo only) wraps the named channels in the Decorator; empty leaves them as is.
      useFactory: (config: ConfigService, ...channels: AlertChannel[]) =>
        withDemoFailures(
          channels,
          parseChannelList(
            config.get<string>('MOCK_FAIL_FIRST_ATTEMPT_CHANNELS'),
          ),
        ),
      inject: [ConfigService, ...CHANNEL_IMPLEMENTATIONS],
    },
    ChannelRegistry,
    RetryPolicy,
    WarningDeliveryService,
    { provide: CLOCK, useClass: SystemClock },
  ],
  exports: [
    WARNINGS_REPOSITORY,
    DELIVERY_RECORDS_REPOSITORY,
    TARGET_AREA_CATALOG,
  ],
})
export class WarningsModule {}
