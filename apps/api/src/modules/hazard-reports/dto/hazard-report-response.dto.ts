import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HazardReportStatus } from '../hazard-report-status.js';
import { HazardType } from '../hazard-type.js';
import { ReporterRole } from '../reporter-role.js';

/** How a stored hazard report looks in API responses (documents Swagger). */
export class HazardReportResponseDto {
  @ApiProperty({ example: '6ac71f73f776c0e7b5e78e36' })
  id!: string;

  @ApiProperty({ enum: HazardType, example: HazardType.Flood })
  hazardType!: HazardType;

  @ApiProperty({ example: 'Water is rising on Main Street' })
  description!: string;

  @ApiPropertyOptional({ example: 'https://example.com/photos/flood.jpg' })
  photoUrl?: string;

  @ApiProperty({ example: 6.9271 })
  latitude!: number;

  @ApiProperty({ example: 79.8612 })
  longitude!: number;

  @ApiProperty({
    description: 'District id',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  district!: string;

  @ApiProperty({ example: '2026-10-08T10:00:00.000Z' })
  capturedAt!: Date;

  @ApiProperty({
    description: 'When the server stored the report',
    example: '2026-10-08T10:00:03.000Z',
  })
  submittedAt!: Date;

  @ApiProperty({
    enum: HazardReportStatus,
    example: HazardReportStatus.PendingVerification,
  })
  status!: HazardReportStatus;

  @ApiProperty({
    description: 'Ids of earlier reports that look like the same event',
    type: [String],
  })
  possibleDuplicateOf!: string[];

  @ApiProperty({ example: 'citizen-001' })
  reporterId!: string;

  @ApiProperty({ enum: ReporterRole, example: ReporterRole.Citizen })
  reporterRole!: ReporterRole;

  @ApiPropertyOptional({ example: 'operator-001' })
  verifiedBy?: string;

  @ApiPropertyOptional({ example: '2026-10-08T11:00:00.000Z' })
  verifiedAt?: Date;

  @ApiPropertyOptional({ example: 'Photo does not match the location' })
  rejectionReason?: string;
}
