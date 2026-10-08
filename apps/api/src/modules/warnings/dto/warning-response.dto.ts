import { ApiProperty } from '@nestjs/swagger';
import type {
  AlertChannelType,
  WarningDto,
  WarningSeverity,
  WarningStatus,
} from '@rescue-lk/shared';
import {
  ALERT_CHANNEL_TYPES,
  WARNING_SEVERITIES,
  WARNING_STATUSES,
} from '../warnings.constants.js';

export class WarningResponseDto implements WarningDto {
  @ApiProperty({ example: '665f1b2c9d3e4a0012345670' })
  id!: string;

  @ApiProperty({ example: '665f1b2c9d3e4a0012345678' })
  hazardReportId!: string;

  @ApiProperty({ example: 'Flood warning: Kelani River' })
  title!: string;

  @ApiProperty({
    example: 'Water levels are rising. Move to higher ground immediately.',
  })
  message!: string;

  @ApiProperty({ enum: WARNING_SEVERITIES, example: 'severe' })
  severity!: WarningSeverity;

  @ApiProperty({ type: [String], example: ['665f1b2c9d3e4a0012345679'] })
  districts!: string[];

  @ApiProperty({
    enum: ALERT_CHANNEL_TYPES,
    isArray: true,
    example: ['push', 'sms'],
  })
  channels!: AlertChannelType[];

  @ApiProperty({ enum: WARNING_STATUSES, example: 'active' })
  status!: WarningStatus;

  @ApiProperty({ format: 'date-time', example: '2026-10-08T12:00:00.000Z' })
  issuedAt!: string;

  @ApiProperty({ format: 'date-time', example: '2026-10-09T18:00:00.000Z' })
  expiresAt!: string;
}
