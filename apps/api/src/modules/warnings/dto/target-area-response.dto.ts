import { ApiProperty } from '@nestjs/swagger';
import type { TargetAreaDto, TargetAreaKind } from '@rescue-lk/shared';
import { TARGET_AREA_KINDS } from '../warnings.constants.js';

export class TargetAreaResponseDto implements TargetAreaDto {
  @ApiProperty({ example: 'B-KALU' })
  id!: string;

  @ApiProperty({ enum: TARGET_AREA_KINDS, example: 'RIVER_BASIN' })
  kind!: TargetAreaKind;

  @ApiProperty({ example: 'Kalu Ganga basin' })
  name!: string;

  @ApiProperty({ type: [String], example: ['Ratnapura', 'Kalutara'] })
  districts!: string[];
}
