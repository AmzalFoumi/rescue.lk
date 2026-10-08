import { ApiProperty } from '@nestjs/swagger';

/** How a district looks in API responses (documents Swagger). */
export class DistrictResponseDto {
  @ApiProperty({ example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  id!: string;

  @ApiProperty({ example: 'Colombo' })
  name!: string;

  @ApiProperty({ example: 'Western' })
  province!: string;

  @ApiProperty({ description: 'Centre of the district', example: 6.9271 })
  latitude!: number;

  @ApiProperty({ description: 'Centre of the district', example: 79.8612 })
  longitude!: number;
}
