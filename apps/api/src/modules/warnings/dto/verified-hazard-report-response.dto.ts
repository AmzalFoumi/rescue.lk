import { ApiProperty } from '@nestjs/swagger';
import type { HazardType, VerifiedHazardReportDto } from '@rescue-lk/shared';
import { HAZARD_TYPES } from '../warnings.constants.js';

export class VerifiedHazardReportResponseDto implements VerifiedHazardReportDto {
  @ApiProperty({ example: '665f1b2c9d3e4a00000000a1' })
  id!: string;

  @ApiProperty({ enum: HAZARD_TYPES, example: 'FLOOD' })
  hazardType!: HazardType;

  @ApiProperty({ example: '665f1b2c9d3e4a00000000d1' })
  district!: string;

  @ApiProperty({ enum: ['verified'], example: 'verified' })
  status!: 'verified';

  @ApiProperty({ example: 'Kelani River overflowing near Kaduwela' })
  description!: string;
}
