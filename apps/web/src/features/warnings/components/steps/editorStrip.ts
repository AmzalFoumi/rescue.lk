import type { VerifiedHazardReportDto } from '@rescue-lk/shared';
import type { WarningFormValues } from '../../form';
import { hazardName, shortId } from '../../format';
import { SEVERITY_META } from '../../meta';
import type { SummaryCell } from '../shell/SummaryStrip';

// Summary strip of the warning editor (steps 3 and 4).
const NOT_SELECTED = 'Not selected';

export const editorStrip = (
  values: WarningFormValues,
  report: VerifiedHazardReportDto | undefined,
  editorLabel: string,
): SummaryCell[] => [
  values.sourceReportId
    ? {
        label: 'Source report',
        value: shortId('R', values.sourceReportId),
        title: values.sourceReportId,
      }
    : { label: 'Source report', value: NOT_SELECTED },
  {
    label: 'Hazard type',
    value: values.hazard
      ? hazardName({ hazard: values.hazard, otherHazard: values.otherHazard })
      : NOT_SELECTED,
  },
  { label: 'District', value: report?.districtName ?? NOT_SELECTED },
  values.severity
    ? { label: 'Warning level', chip: SEVERITY_META[values.severity] }
    : { label: 'Warning level', value: NOT_SELECTED },
  { label: 'Status', value: editorLabel },
];
