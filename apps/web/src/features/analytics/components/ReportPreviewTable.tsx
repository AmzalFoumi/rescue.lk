import type { TabularReportData } from '@rescue-lk/shared/analytics/report.types';
import { Panel, StateMessage } from '../../response/components/ui';

export function ReportPreviewTable({
  report,
}: {
  report: TabularReportData | null;
}) {
  if (!report) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-[10px] border border-dashed border-line bg-page">
        <StateMessage
          kind="empty"
          message="Select a report type and click Generate to see the preview."
        />
      </div>
    );
  }

  return (
    <Panel title={report.title}>
      <div className="border-b border-line px-4 py-3">
        <p className="text-[13px] text-ink-muted mb-2">{report.description}</p>
        <p className="text-xs text-ink-muted">
          Period: {report.filters.from.slice(0, 10)} to{' '}
          {report.filters.to.slice(0, 10)}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead className="border-b border-line bg-page text-ink-muted">
            <tr>
              {report.columns.map((c) => (
                <th
                  key={c.key}
                  className={`px-4 py-2 font-semibold ${
                    c.align === 'right'
                      ? 'text-right'
                      : c.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                  }`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-ink">
            {report.rows.length === 0 ? (
              <tr>
                <td colSpan={report.columns.length}>
                  <StateMessage
                    kind="empty"
                    message="No data found for the selected filters."
                  />
                </td>
              </tr>
            ) : (
              report.rows.map((row, i) => (
                <tr key={i} className="hover:bg-page transition-colors">
                  {report.columns.map((c) => (
                    <td
                      key={c.key}
                      className={`px-4 py-3 whitespace-nowrap ${
                        c.align === 'right'
                          ? 'text-right'
                          : c.align === 'center'
                            ? 'text-center'
                            : 'text-left'
                      }`}
                    >
                      {row[c.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="border-t border-line bg-page px-4 py-2 text-right text-[11px] text-ink-muted">
        Generated at: {new Date(report.generatedAt).toLocaleString()}
      </div>
    </Panel>
  );
}
