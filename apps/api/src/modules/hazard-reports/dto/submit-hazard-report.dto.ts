import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
} from 'class-validator';
import { HazardType, ReporterRole } from '../hazard-type.js';

// enterReportDetails + attachPhoto + captureLocation from the sequence diagram.
// The client app captures the GPS position, so it is sent as plain numbers.
export class SubmitHazardReportDto {
  @ApiProperty({ enum: HazardType, example: HazardType.Flood })
  @IsEnum(HazardType)
  hazardType!: HazardType;

  @ApiProperty({ example: 'Water is rising on Main Street' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description!: string;

  @ApiPropertyOptional({ example: 'https://example.com/photos/flood.jpg' })
  @IsOptional()
  @IsUrl()
  photoUrl?: string;

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
