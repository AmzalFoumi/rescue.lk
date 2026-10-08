import { ApiProperty } from '@nestjs/swagger';
import type {
  AlertChannelType,
  DeliveryRecordDto,
  DeliveryStatus,
} from '@rescue-lk/shared';
import {
  ALERT_CHANNEL_TYPES,
  DELIVERY_STATUSES,
} from '../warnings.constants.js';

export class DeliveryRecordResponseDto implements DeliveryRecordDto {
  @ApiProperty({ example: '665f1b2c9d3e4a0012345671' })
  id!: string;

  @ApiProperty({ example: '665f1b2c9d3e4a0012345670' })
  warningId!: string;

  @ApiProperty({ example: 1 })
  warningVersion!: number;

  @ApiProperty({ enum: ALERT_CHANNEL_TYPES, example: 'SMS' })
  channel!: AlertChannelType;

  @ApiProperty({ enum: DELIVERY_STATUSES, example: 'SENT' })
  status!: DeliveryStatus;

  @ApiProperty({ example: 2 })
  attempts!: number;

  @ApiProperty({ example: 240000 })
  recipients!: number;

  @ApiProperty({ format: 'date-time', nullable: true, type: String })
  lastAttemptAt!: string | null;

  @ApiProperty({ description: 'Last error, empty when none', example: '' })
  error!: string;
}
