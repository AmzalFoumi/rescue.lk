import { ApiProperty } from '@nestjs/swagger';
import type { HazardType, VerifiedHazardReportDto } from '@rescue-lk/shared';
import { HAZARD_TYPES } from '../warnings.constants.js';

// VerifiedHazardReportResponseDto is a hazard report a warning can be based on, as
// returned by GET /warnings/verified-reports and documented in Swagger.
// It implements the shared VerifiedHazardReportDto, so the API and the web app agree
// on the shape.
export class VerifiedHazardReportResponseDto implements VerifiedHazardReportDto {
  @ApiProperty({ example: '665f1b2c9d3e4a00000000a1' })
  id!: string;

  @ApiProperty({ enum: HAZARD_TYPES, example: 'FLOOD' })
  hazardType!: HazardType;

  @ApiProperty({ example: '665f1b2c9d3e4a00000000d1' })
  district!: string;

  @ApiProperty({ example: 'Ratnapura' })
  districtName!: string;

  @ApiProperty({ example: 'Ratnapura town' })
  place!: string;

  @ApiProperty({ example: 'Nimal Perera' })
  reporter!: string;

  @ApiProperty({ enum: ['verified'], example: 'verified' })
  status!: 'verified';

  @ApiProperty({ example: 'Kalu Ganga overflowing into low-lying roads' })
  description!: string;

  @ApiProperty({ format: 'date-time', example: '2026-10-08T03:55:00.000Z' })
  submittedAt!: string;

  @ApiProperty({ format: 'date-time', example: '2026-10-08T04:20:00.000Z' })
  verifiedAt!: string;

  @ApiProperty({ example: 'K. Jayawardena' })
  verifiedBy!: string;
}
