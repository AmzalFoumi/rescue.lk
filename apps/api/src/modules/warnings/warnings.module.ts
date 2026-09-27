import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WarningsController } from './warnings.controller.js';
import { WarningsService } from './warnings.service.js';
import { MongooseWarningsRepository } from './mongoose-warnings.repository.js';
import { WARNINGS_REPOSITORY } from './warnings.repository.interface.js';
import { Warning, WarningSchema } from './schemas/warning.schema.js';

@Module({
  imports: [MongooseModule.forFeature([{ name: Warning.name, schema: WarningSchema }])],
  controllers: [WarningsController],
  providers: [
    WarningsService,
    { provide: WARNINGS_REPOSITORY, useClass: MongooseWarningsRepository },
  ],
})
export class WarningsModule {}
