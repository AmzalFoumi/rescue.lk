import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

// One update never moves more people than the largest shelter could hold.
const MAX_PEOPLE_PER_UPDATE = 10_000;

/** updateOccupancy(newCount) from Update Shelter Occupancy. */
export class UpdateOccupancyDto {
  @ApiProperty({
    description:
      'How many people arrived. Use a negative number when people leave.',
    example: 25,
  })
  @Type(() => Number)
  @IsInt()
  @Min(-MAX_PEOPLE_PER_UPDATE)
  @Max(MAX_PEOPLE_PER_UPDATE)
  people!: number;
}
