import { Injectable } from '@nestjs/common';
import * as pdfMakeModule from 'pdfmake';
// @ts-ignore
import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import type { TabularReportData } from '@rescue-lk/shared/analytics/report.types';
import type { ReportExporter } from './report-exporter.interface.js';

const FONTS = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

const pdfMake = (pdfMakeModule as any).default || pdfMakeModule;

@Injectable()
export class PdfReportExporter implements ReportExporter {
  readonly format = 'PDF' as const;
  readonly contentType = 'application/pdf';
  readonly fileExtension = 'pdf';

  constructor() {
    if (pdfMake && typeof pdfMake.setFonts === 'function') {
      pdfMake.setFonts(FONTS);
    }
  }

  async export(report: TabularReportData): Promise<Buffer> {
    const tableBody = [
      report.columns.map((c) => ({
        text: c.label,
        style: 'tableHeader',
        alignment: c.align ?? 'left',
      })),
      ...report.rows.map((row) =>
        report.columns.map((c) => ({
          text: String(row[c.key] ?? ''),
          alignment: c.align ?? 'left',
        })),
      ),
    ];

    const definition: TDocumentDefinitions = {
      pageOrientation: report.columns.length > 5 ? 'landscape' : 'portrait',
      defaultStyle: { font: 'Helvetica', fontSize: 9 },
      content: [
        { text: 'rescue.lk', style: 'brand' },
        { text: report.title, style: 'title' },
        { text: report.description, margin: [0, 4, 0, 8] },
        {
          text: `Period: ${report.filters.from.slice(0, 10)} to ${report.filters.to.slice(0, 10)}`,
          margin: [0, 0, 0, 12],
        },
        {
          table: {
            headerRows: 1,
            widths: report.columns.map(() => '*'),
            body: tableBody,
          },
          layout: 'lightHorizontalLines',
        },
        {
          text: `Generated at: ${report.generatedAt}`,
          style: 'footer',
          margin: [0, 16, 0, 0],
        },
      ],
      styles: {
        brand: { fontSize: 10, bold: true, color: '#1f5a99' },
        title: { fontSize: 18, bold: true, margin: [0, 8, 0, 4] },
        tableHeader: { bold: true, fillColor: '#e8f1fb' },
        footer: { fontSize: 8, color: '#666666' },
      },
    };

    const doc = pdfMake.createPdf(definition);
    return doc.getBuffer();
  }
}
