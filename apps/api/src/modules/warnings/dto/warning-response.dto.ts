import { ApiProperty } from '@nestjs/swagger';
import type {
  AlertChannelType,
  HazardType,
  WarningDto,
  WarningSeverity,
  WarningStatus,
} from '@rescue-lk/shared';
import {
  ALERT_CHANNEL_TYPES,
  HAZARD_TYPES,
  WARNING_SEVERITIES,
  WARNING_STATUSES,
} from '../warnings.constants.js';

export class WarningResponseDto implements WarningDto {
  @ApiProperty({ example: '665f1b2c9d3e4a0012345670' })
  id!: string;

  @ApiProperty({ example: '665f1b2c9d3e4a00000000a1' })
  sourceReportId!: string;

  @ApiProperty({ enum: HAZARD_TYPES, example: 'FLOOD' })
  hazard!: HazardType;

  @ApiProperty({ description: 'Set only when hazard is OTHER', example: '' })
  otherHazard!: string;

  @ApiProperty({ enum: WARNING_SEVERITIES, example: 'HIGH' })
  severity!: WarningSeverity;

  @ApiProperty({ type: [String], example: ['B-KALU', 'D-RATNAPURA'] })
  areaIds!: string[];

  @ApiProperty({
    example:
      'The Kalu Ganga is rising quickly. Low-lying areas may flood within hours.',
  })
  message!: string;

  @ApiProperty({ example: 'Move to higher ground.\nKeep a torch ready.' })
  instructions!: string;

  @ApiProperty({
    enum: ALERT_CHANNEL_TYPES,
    isArray: true,
    example: ['SMS', 'PUSH'],
  })
  channels!: AlertChannelType[];

  @ApiProperty({ enum: WARNING_STATUSES, example: 'ACTIVE' })
  status!: WarningStatus;

  @ApiProperty({ example: 1 })
  version!: number;

  @ApiProperty({ example: 'Assessment Officer' })
  createdBy!: string;

  @ApiProperty({ format: 'date-time', example: '2026-10-08T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time', nullable: true, type: String })
  publishedAt!: string | null;

  @ApiProperty({ format: 'date-time', nullable: true, type: String })
  updatedAt!: string | null;

  @ApiProperty({ format: 'date-time', nullable: true, type: String })
  cancelledAt!: string | null;

  @ApiProperty({ example: '' })
  cancelReason!: string;
}
