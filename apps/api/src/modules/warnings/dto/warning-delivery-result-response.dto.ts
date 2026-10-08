import { ApiProperty } from '@nestjs/swagger';
import type { WarningDeliveryResultDto } from '@rescue-lk/shared';
import { DeliveryRecordResponseDto } from './delivery-record-response.dto.js';
import { WarningResponseDto } from './warning-response.dto.js';

export class WarningDeliveryResultResponseDto implements WarningDeliveryResultDto {
  @ApiProperty({ type: WarningResponseDto })
  warning!: WarningResponseDto;

  @ApiProperty({ type: [DeliveryRecordResponseDto] })
  deliveries!: DeliveryRecordResponseDto[];
}
