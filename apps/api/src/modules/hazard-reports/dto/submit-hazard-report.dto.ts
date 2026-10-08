import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { HazardType } from '../hazard-type.js';
import type { Location } from '../location.js';
import type { ReportSubmission } from '../report-submission.js';
import { ReporterRole } from '../reporter-role.js';

const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_SHORT_TEXT_LENGTH = 100;

/** A GPS position: latitude between -90 and 90, longitude between -180 and 180. */
export class LocationDto implements Location {
  @ApiProperty({ example: 6.9271 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({ example: 79.8612 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;
}

/**
 * enterReportDetails + attachPhoto + captureLocation from the sequence diagram.
 * The client app captures the GPS position, so it is sent as plain numbers.
 */
export class SubmitHazardReportDto implements ReportSubmission {
  @ApiProperty({ enum: HazardType, example: HazardType.Flood })
  @IsEnum(HazardType)
  hazardType!: HazardType;

  @ApiProperty({ example: 'Water is rising on Main Street' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_DESCRIPTION_LENGTH)
  description!: string;

  @ApiPropertyOptional({ example: 'https://example.com/photos/flood.jpg' })
  @IsOptional()
  @IsUrl()
  photoUrl?: string;

  @ApiPropertyOptional({ example: 'Kuruwita bridge' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_SHORT_TEXT_LENGTH)
  placeName?: string;

  @ApiPropertyOptional({ example: 'Nimal Perera' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_SHORT_TEXT_LENGTH)
  reporterName?: string;

  @ApiPropertyOptional({
    description: 'Used when the type is other',
    example: 'Fallen power line',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_SHORT_TEXT_LENGTH)
  otherHazard?: string;

  @ApiProperty({ type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  location!: LocationDto;

  @ApiProperty({
    description: 'District id',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @IsMongoId()
  district!: string;

  @ApiProperty({
    description: 'When the report was captured',
    example: '2026-10-08T10:00:00Z',
  })
  @IsDateString()
  capturedAt!: string;

  @ApiProperty({ example: 'citizen-001' })
  @IsString()
  @IsNotEmpty()
  reporterId!: string;

  @ApiProperty({ enum: ReporterRole, example: ReporterRole.Citizen })
  @IsEnum(ReporterRole)
  reporterRole!: ReporterRole;
}
