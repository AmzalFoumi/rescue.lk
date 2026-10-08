import { ApiProperty } from '@nestjs/swagger';
import type { WarningDeliveryResultDto } from '@rescue-lk/shared';
import { DeliveryRecordResponseDto } from './delivery-record-response.dto.js';
import { WarningResponseDto } from './warning-response.dto.js';

// WarningDeliveryResultResponseDto is the answer to publish and update: the saved
// warning plus the delivery record of each channel, so the UI can open the delivery
// status step straight away. It implements the shared type.
export class WarningDeliveryResultResponseDto implements WarningDeliveryResultDto {
  @ApiProperty({ type: WarningResponseDto })
  warning!: WarningResponseDto;

  @ApiProperty({ type: [DeliveryRecordResponseDto] })
  deliveries!: DeliveryRecordResponseDto[];
}
