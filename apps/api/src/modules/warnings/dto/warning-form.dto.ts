import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import type {
  AlertChannelType,
  HazardType,
  WarningFormRequestDto,
  WarningSeverity,
} from '@rescue-lk/shared';
import {
  ALERT_CHANNEL_TYPES,
  HAZARD_TYPES,
  OTHER_HAZARD_MAX_LENGTH,
  WARNING_INSTRUCTIONS_MAX_LENGTH,
  WARNING_MESSAGE_MAX_LENGTH,
  WARNING_SEVERITIES,
} from '../warnings.constants.js';

// WarningFormDto checks the shape of the warning form in a request body.
// SRP: only shape and type checks here (ids, enums, maximum lengths), run by the
// ValidationPipe before the controller is reached (fail fast).
// Business rules (minimum message length, at least one area, publish-only fields)
// belong to WarningValidator and come back as one error per field.
// It implements the shared WarningFormRequestDto, so the web app sends the same shape.
export class WarningFormDto implements WarningFormRequestDto {
  @ApiProperty({
    description: 'Verified hazard report this warning is based on',
    example: '665f1b2c9d3e4a00000000a1',
  })
  @IsMongoId()
  sourceReportId!: string;

  @ApiProperty({ enum: HAZARD_TYPES, example: 'FLOOD' })
  @IsIn(HAZARD_TYPES)
  hazard!: HazardType;

  @ApiPropertyOptional({
    description: 'Name of the hazard when hazard is OTHER',
    maxLength: OTHER_HAZARD_MAX_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(OTHER_HAZARD_MAX_LENGTH)
  otherHazard?: string;

  @ApiProperty({ enum: WARNING_SEVERITIES, example: 'HIGH' })
  @IsIn(WARNING_SEVERITIES)
  severity!: WarningSeverity;

  @ApiProperty({
    type: [String],
    description: 'District or river basin ids',
    example: ['B-KALU', 'D-RATNAPURA'],
  })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  areaIds!: string[];

  @ApiProperty({
    maxLength: WARNING_MESSAGE_MAX_LENGTH,
    example:
      'The Kalu Ganga is rising quickly. Low-lying areas may flood within hours.',
  })
  @IsString()
  @MaxLength(WARNING_MESSAGE_MAX_LENGTH)
  message!: string;

  @ApiPropertyOptional({
    description: 'Safety instructions, one per line',
    maxLength: WARNING_INSTRUCTIONS_MAX_LENGTH,
    example: 'Move to higher ground.\nKeep a torch and water ready.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(WARNING_INSTRUCTIONS_MAX_LENGTH)
  instructions?: string;

  @ApiPropertyOptional({
    enum: ALERT_CHANNEL_TYPES,
    isArray: true,
    example: ['SMS', 'PUSH'],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(ALERT_CHANNEL_TYPES, { each: true })
  channels?: AlertChannelType[];
}
