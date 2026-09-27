import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResponseController } from './response.controller.js';
import { ResponseService } from './response.service.js';
import { MongooseResponseRepository } from './mongoose-response.repository.js';
import { RESPONSE_REPOSITORY } from './response.repository.interface.js';
import { Incident, IncidentSchema } from './schemas/incident.schema.js';
import { Shelter, ShelterSchema } from './schemas/shelter.schema.js';
import { Resource, ResourceSchema } from './schemas/resource.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Incident.name, schema: IncidentSchema },
      { name: Shelter.name, schema: ShelterSchema },
      { name: Resource.name, schema: ResourceSchema },
    ]),
  ],
  controllers: [ResponseController],
  providers: [
    ResponseService,
    { provide: RESPONSE_REPOSITORY, useClass: MongooseResponseRepository },
  ],
})
export class ResponseModule {}
