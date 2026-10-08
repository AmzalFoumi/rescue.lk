import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/** Query of GET /hazard-reports. */
export class ListHazardReportsQueryDto {
  @ApiPropertyOptional({
    description:
      "Only this reporter's reports (all statuses). Without it: the reports waiting for verification.",
    example: 'citizen-nimal',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  reporterId?: string;
}
