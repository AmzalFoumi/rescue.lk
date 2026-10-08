import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

  @ApiProperty({ enum: ALERT_CHANNEL_TYPES, example: 'sms' })
  channel!: AlertChannelType;

  @ApiProperty({ enum: DELIVERY_STATUSES, example: 'sent' })
  status!: DeliveryStatus;

  @ApiProperty({ example: 1 })
  attempts!: number;

  @ApiPropertyOptional({ example: 'SMS gateway timeout' })
  failureReason?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    example: '2026-10-08T12:00:05.000Z',
  })
  lastAttemptAt?: string;
}
