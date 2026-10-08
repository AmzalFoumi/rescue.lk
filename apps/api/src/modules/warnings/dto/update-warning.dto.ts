import { OmitType } from '@nestjs/swagger';
import type { UpdateWarningRequestDto } from '@rescue-lk/shared';
import { WarningFormDto } from './warning-form.dto.js';

// UpdateWarningDto is the request body for updating an ACTIVE warning: the form
// without its source report, which cannot change after publishing.
// DRY: OmitType reuses each field's validation rules from WarningFormDto instead of
// copying them.
export class UpdateWarningDto
  extends OmitType(WarningFormDto, ['sourceReportId'] as const)
  implements UpdateWarningRequestDto {}
