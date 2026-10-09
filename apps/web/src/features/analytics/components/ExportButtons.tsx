import { Download } from 'lucide-react';
import type { ExportFormat } from '@rescue-lk/shared/analytics/report.types';
import { Button } from '../../response/components/ui';

interface ExportButtonsProps {
  isDisabled: boolean;
  isExporting: boolean;
  onExport: (format: ExportFormat) => void;
}

export function ExportButtons({
  isDisabled,
  isExporting,
  onExport,
}: ExportButtonsProps) {
  return (
    <div className="mt-4 flex gap-3 justify-end">
      <Button
        variant="outline"
        onClick={() => onExport('CSV')}
        disabled={isDisabled || isExporting}
      >
        <Download className="size-4" />
        Export CSV
      </Button>
      <Button
        variant="primary"
        onClick={() => onExport('PDF')}
        disabled={isDisabled || isExporting}
      >
        <Download className="size-4" />
        Export PDF
      </Button>
    </div>
  );
}
