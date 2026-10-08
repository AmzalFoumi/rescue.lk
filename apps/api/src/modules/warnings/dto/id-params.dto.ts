import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

// Path parameters, validated so a malformed id is a 400, not a database error.

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
