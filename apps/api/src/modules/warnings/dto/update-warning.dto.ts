import { OmitType } from '@nestjs/swagger';
import type { UpdateWarningRequestDto } from '@rescue-lk/shared';
import { WarningFormDto } from './warning-form.dto.js';

// Body for updating an ACTIVE warning: the form without its source report,
// which cannot change. OmitType keeps the validation rules of each field.
export class UpdateWarningDto
  extends OmitType(WarningFormDto, ['sourceReportId'] as const)
  implements UpdateWarningRequestDto {}
