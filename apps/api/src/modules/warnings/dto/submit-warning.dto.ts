import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import type { SubmitWarningRequestDto } from '@rescue-lk/shared';
import { CREATED_BY_MAX_LENGTH } from '../warnings.constants.js';
import { WarningFormDto } from './warning-form.dto.js';

// SubmitWarningDto is the request body for saving a draft or publishing: the warning
// form plus who submitted it (and the draft id when continuing a draft).
// DRY: it extends WarningFormDto, so each field's validation rule is written once.
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

  @ApiPropertyOptional({
    description:
      'Existing DRAFT to edit or publish; omit to create a new warning',
    example: '665f1b2c9d3e4a0012345670',
  })
  @IsOptional()
  @IsMongoId()
  draftId?: string;
}
