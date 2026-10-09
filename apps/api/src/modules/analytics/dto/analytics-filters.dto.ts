import { IsDateString, IsOptional, IsString } from 'class-validator';

export class AnalyticsFiltersDto {
  @IsDateString()
  from!: string;

  @IsDateString()
  to!: string;

  @IsOptional()
  @IsString()
  hazardType?: string;

  @IsOptional()
  @IsString()
  district?: string;
}
