import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsIn,
  IsISO8601,
  IsMongoId,
  IsString,
  Length,
} from 'class-validator';
import type {
  AlertChannelType,
  IssueWarningRequestDto,
  WarningSeverity,
} from '@rescue-lk/shared';
import {
  ALERT_CHANNEL_TYPES,
  WARNING_MESSAGE_MAX_LENGTH,
  WARNING_MESSAGE_MIN_LENGTH,
  WARNING_SEVERITIES,
  WARNING_TITLE_MAX_LENGTH,
  WARNING_TITLE_MIN_LENGTH,
} from '../warnings.constants.js';

export class IssueWarningDto implements IssueWarningRequestDto {
  @ApiProperty({
    description: 'Id of the verified hazard report this warning is based on',
    example: '665f1b2c9d3e4a0012345678',
  })
  @IsMongoId()
  hazardReportId!: string;

  @ApiProperty({
    minLength: WARNING_TITLE_MIN_LENGTH,
    maxLength: WARNING_TITLE_MAX_LENGTH,
    example: 'Flood warning: Kelani River',
  })
  @IsString()
  @Length(WARNING_TITLE_MIN_LENGTH, WARNING_TITLE_MAX_LENGTH)
  title!: string;

  @ApiProperty({
    minLength: WARNING_MESSAGE_MIN_LENGTH,
    maxLength: WARNING_MESSAGE_MAX_LENGTH,
    example: 'Water levels are rising. Move to higher ground immediately.',
  })
  @IsString()
  @Length(WARNING_MESSAGE_MIN_LENGTH, WARNING_MESSAGE_MAX_LENGTH)
  message!: string;

  @ApiProperty({ enum: WARNING_SEVERITIES, example: 'severe' })
  @IsIn(WARNING_SEVERITIES)
  severity!: WarningSeverity;

  @ApiProperty({
    type: [String],
    description: 'Target district ids',
    example: ['665f1b2c9d3e4a0012345679'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsMongoId({ each: true })
  districts!: string[];

  @ApiProperty({
    enum: ALERT_CHANNEL_TYPES,
    isArray: true,
    example: ['push', 'sms'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsIn(ALERT_CHANNEL_TYPES, { each: true })
  channels!: AlertChannelType[];

  @ApiProperty({
    format: 'date-time',
    example: '2026-10-09T18:00:00.000Z',
  })
  @IsISO8601({ strict: true })
  expiresAt!: string;
}
