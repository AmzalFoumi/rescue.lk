import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsOptional, IsString } from 'class-validator';

// ?areaIds=B-KALU&areaIds=D-COLOMBO. A single value arrives as a string, so it
// is wrapped in a list; no value means no area selected yet.
export class ReachQueryDto {
  @ApiPropertyOptional({
    type: [String],
    description: 'District or river basin ids',
    example: ['B-KALU'],
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? [value] : value,
  )
  @IsArray()
  @IsString({ each: true })
  areaIds: string[] = [];
}
