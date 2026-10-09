import { IsIn } from 'class-validator';
import type { ExportFormat } from '@rescue-lk/shared/analytics/report.types';
import { EXPORT_FORMATS } from '../constants/report.constants.js';
import { GenerateReportDto } from './generate-report.dto.js';

export class ExportReportDto extends GenerateReportDto {
  @IsIn([...EXPORT_FORMATS])
  format!: ExportFormat;
}
