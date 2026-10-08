import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

// Path parameters, validated so a malformed id is a 400, not a database error.

// Path parameter DTOs for warning and delivery record ids.
// Fail fast: the ValidationPipe rejects a malformed id with a 400 before the request
// reaches a service or the database, so services can trust the id format.
export class WarningIdParamDto {
  @ApiProperty({ example: '665f1b2c9d3e4a0012345670' })
  @IsMongoId()
  id!: string;
}

export class DeliveryRecordIdParamDto {
  @ApiProperty({ example: '665f1b2c9d3e4a0012345671' })
  @IsMongoId()
  recordId!: string;
}
