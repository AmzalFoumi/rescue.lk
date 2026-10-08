import { ApiProperty } from '@nestjs/swagger';
import { HazardReportStatus } from '../hazard-report-status.js';

export class QueuedReportResponseDto {
  @ApiProperty({
    enum: HazardReportStatus,
    example: HazardReportStatus.PendingSynchronisation,
  })
  status!: HazardReportStatus;

  @ApiProperty({ example: 1 })
  pendingCount!: number;
}

export class SyncResponseDto {
  @ApiProperty({ example: 1 })
  synced!: number;

  @ApiProperty({ example: 0 })
  stillQueued!: number;
}
