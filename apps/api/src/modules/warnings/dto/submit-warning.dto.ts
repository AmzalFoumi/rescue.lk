import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import type { SubmitWarningRequestDto } from '@rescue-lk/shared';
import { CREATED_BY_MAX_LENGTH } from '../warnings.constants.js';
import { WarningFormDto } from './warning-form.dto.js';

// Body for saving a draft or publishing: the form plus who submitted it.
export class SubmitWarningDto
  extends WarningFormDto
  implements SubmitWarningRequestDto
{
  @ApiProperty({
    description: 'Officer submitting the warning (no login yet)',
    maxLength: CREATED_BY_MAX_LENGTH,
    example: 'Assessment Officer',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(CREATED_BY_MAX_LENGTH)
  createdBy!: string;
}
