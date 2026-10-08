import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import type { WarningStatus } from '@rescue-lk/shared';
import { WARNING_STATUSES } from '../warnings.constants.js';

export class ListWarningsQueryDto {
  @ApiPropertyOptional({
    enum: WARNING_STATUSES,
    description: 'Only warnings in this status; omit for all',
  })
  @IsOptional()
  @IsIn(WARNING_STATUSES)
  status?: WarningStatus;
}
