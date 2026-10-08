import type {
  VerifiedHazardReportDto,
  WarningFormErrors,
} from '@rescue-lk/shared';
import type { WarningFormValues } from '../../form';
import type { SetFormField } from '../../hooks/useWarningForm';
import { HazardPicker } from '../HazardPicker';
import { ReportPicker } from '../ReportPicker';
import { SeverityPicker } from '../SeverityPicker';
import { Card } from '../shell/Card';

interface AssessmentPanelProps {
  values: WarningFormValues;
  errors: WarningFormErrors;
  reports: readonly VerifiedHazardReportDto[];
  // An update keeps its source report.
  sourceLocked: boolean;
  onSourceChange: (reportId: string) => void;
  onFieldChange: SetFormField;
}

// Source report, hazard type and warning level.
export function AssessmentPanel({
  values,
  errors,
  reports,
  sourceLocked,
  onSourceChange,
  onFieldChange,
}: AssessmentPanelProps) {
  return (
    <Card title="Assessment" titleId="assessment-title">
      <div className="flex flex-col gap-4 p-4">
        <ReportPicker
          reports={reports}
          value={values.sourceReportId}
          onChange={onSourceChange}
          disabled={sourceLocked}
          error={errors.sourceReportId}
        />
        <HazardPicker
          hazard={values.hazard}
          otherHazard={values.otherHazard}
          onHazardChange={(hazard) => onFieldChange('hazard', hazard)}
          onOtherHazardChange={(name) => onFieldChange('otherHazard', name)}
          hazardError={errors.hazard}
          otherHazardError={errors.otherHazard}
        />
        <SeverityPicker
          value={values.severity}
          onChange={(severity) => onFieldChange('severity', severity)}
          error={errors.severity}
        />
      </div>
    </Card>
  );
}
