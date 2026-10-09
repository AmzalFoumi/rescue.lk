import { IsIn } from 'class-validator';
import type { ReportType } from '@rescue-lk/shared/analytics/report.types';
import { REPORT_TYPES } from '../constants/report.constants.js';
import { AnalyticsFiltersDto } from './analytics-filters.dto.js';

export class GenerateReportDto extends AnalyticsFiltersDto {
  @IsIn([...REPORT_TYPES])
  type!: ReportType;
}
