import { ApiProperty } from '@nestjs/swagger';
import type { TargetAreaDto, TargetAreaKind } from '@rescue-lk/shared';
import { TARGET_AREA_KINDS } from '../warnings.constants.js';

// TargetAreaResponseDto is a district or river basin a warning can target, as
// returned by GET /warnings/target-areas and documented in Swagger.
// It implements the shared TargetAreaDto.
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
