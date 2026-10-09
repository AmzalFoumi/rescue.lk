import { Inject, Injectable } from '@nestjs/common';
import type { ExportFormat } from '@rescue-lk/shared/analytics/report.types';
import { UnsupportedExportFormatException } from '../exceptions/unsupported-export-format.exception.js';
import {
  REPORT_EXPORTERS,
  type ReportExporter,
} from './report-exporter.interface.js';

@Injectable()
export class ReportExporterRegistry {
  private readonly byFormat: ReadonlyMap<ExportFormat, ReportExporter>;

  constructor(@Inject(REPORT_EXPORTERS) exporters: readonly ReportExporter[]) {
    this.byFormat = new Map(exporters.map((e) => [e.format, e]));
  }

  get(format: ExportFormat): ReportExporter {
    const exporter = this.byFormat.get(format);
    if (!exporter) throw new UnsupportedExportFormatException(format);
    return exporter;
  }
}
