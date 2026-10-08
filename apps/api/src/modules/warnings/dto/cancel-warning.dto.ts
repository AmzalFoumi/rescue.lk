import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';
import type { CancelWarningRequestDto } from '@rescue-lk/shared';
import { CANCEL_REASON_MAX_LENGTH } from '../warnings.constants.js';

// CancelWarningDto is the request body for cancelling an ACTIVE warning.
// It only checks that the reason is text of an allowed length.
// SRP: the business rule "a reason is required" lives in WarningValidator, which
// trims the text and returns a field error the UI shows under the reason box.
export class CancelWarningDto implements CancelWarningRequestDto {
  @ApiProperty({
    maxLength: CANCEL_REASON_MAX_LENGTH,
    example: 'River level has fallen below the danger mark.',
  })
  @IsString()
  @MaxLength(CANCEL_REASON_MAX_LENGTH)
  reason!: string;
}
