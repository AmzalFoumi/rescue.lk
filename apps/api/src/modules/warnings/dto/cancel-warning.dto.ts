import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';
import type { CancelWarningRequestDto } from '@rescue-lk/shared';
import { CANCEL_REASON_MAX_LENGTH } from '../warnings.constants.js';

// A blank reason is rejected by WarningsService.cancel with a field error.
export class CancelWarningDto implements CancelWarningRequestDto {
  @ApiProperty({
    maxLength: CANCEL_REASON_MAX_LENGTH,
    example: 'River level has fallen below the danger mark.',
  })
  @IsString()
  @MaxLength(CANCEL_REASON_MAX_LENGTH)
  reason!: string;
}
