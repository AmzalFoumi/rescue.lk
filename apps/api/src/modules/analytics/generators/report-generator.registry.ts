import { Inject, Injectable } from '@nestjs/common';
import type { ReportType } from '@rescue-lk/shared/analytics/report.types';
import { UnsupportedReportTypeException } from '../exceptions/unsupported-report-type.exception.js';
import {
  REPORT_GENERATORS,
  type ReportGenerator,
} from './report-generator.interface.js';

@Injectable()
export class ReportGeneratorRegistry {
  private readonly byType: ReadonlyMap<ReportType, ReportGenerator>;

  constructor(
    @Inject(REPORT_GENERATORS) generators: readonly ReportGenerator[],
  ) {
    this.byType = new Map(generators.map((g) => [g.type, g]));
  }

  get(type: ReportType): ReportGenerator {
    const generator = this.byType.get(type);
    if (!generator) throw new UnsupportedReportTypeException(type);
    return generator;
  }
}
