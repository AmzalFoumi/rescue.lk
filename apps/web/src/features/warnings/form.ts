import type {
  AlertChannelType,
  VerifiedHazardReportDto,
  HazardType,
  SubmitWarningRequestDto,
  UpdateWarningRequestDto,
  WarningDto,
  WarningFormErrors,
  WarningFormRequestDto,
  WarningSeverity,
} from '@rescue-lk/shared';
import { OTHER_HAZARD } from './constants';

// The form as edited in the browser. Hazard and severity start unselected;
// the API reports missing or invalid values per field, so the rules are not
// duplicated here.
export interface WarningFormValues {
  sourceReportId: string;
  hazard: HazardType | '';
  otherHazard: string;
  severity: WarningSeverity | '';
  areaIds: string[];
  message: string;
  instructions: string;
  channels: AlertChannelType[];
}

export const EMPTY_FORM: WarningFormValues = {
  sourceReportId: '',
  hazard: '',
  otherHazard: '',
  severity: '',
  areaIds: [],
  message: '',
  instructions: '',
  channels: [],
};

// Channels a new warning starts with, as in the design.
const DEFAULT_CHANNELS: AlertChannelType[] = ['SMS', 'PUSH'];

// A new warning, pre-filled from its source report when one is chosen:
// the report's hazard and its district as the first area.
export const blankForm = (
  report?: VerifiedHazardReportDto,
  reportAreaId?: string,
): WarningFormValues => ({
  ...EMPTY_FORM,
  sourceReportId: report?.id ?? '',
  hazard: report?.hazardType ?? '',
  areaIds: reportAreaId ? [reportAreaId] : [],
  channels: [...DEFAULT_CHANNELS],
});

// Choosing a source report takes its hazard, and its district as the first
// area unless areas are already chosen. No report clears the choice only.
export const applySourceReport = (
  values: WarningFormValues,
  report?: VerifiedHazardReportDto,
  reportAreaId?: string,
): WarningFormValues => {
  if (!report) {
    return { ...values, sourceReportId: '' };
  }
  return {
    ...values,
    sourceReportId: report.id,
    hazard: report.hazardType,
    areaIds:
      values.areaIds.length > 0 || !reportAreaId
        ? values.areaIds
        : [reportAreaId],
  };
};

// Step 3 only checks that its fields are filled in before moving on; every
// rule is still enforced by the API when the warning is saved or published.
export const levelStepErrors = (
  values: WarningFormValues,
): WarningFormErrors => {
  const errors: WarningFormErrors = {};
  if (!values.sourceReportId) {
    errors.sourceReportId =
      'Select the verified report this warning is based on.';
  }
  if (!values.hazard) {
    errors.hazard = 'Choose a hazard type.';
  }
  if (values.hazard === OTHER_HAZARD && !values.otherHazard.trim()) {
    errors.otherHazard = 'Name the hazard.';
  }
  if (!values.severity) {
    errors.severity = 'Choose a warning level.';
  }
  return errors;
};

export const formFromWarning = (warning: WarningDto): WarningFormValues => ({
  sourceReportId: warning.sourceReportId,
  hazard: warning.hazard,
  otherHazard: warning.otherHazard,
  severity: warning.severity,
  areaIds: [...warning.areaIds],
  message: warning.message,
  instructions: warning.instructions,
  channels: [...warning.channels],
});

// An unselected hazard or severity is sent as '' and rejected by the API with
// a field error, which the form then shows next to the input.
// An update keeps the original source report, so it is not sent.
export const toUpdateRequest = (
  values: WarningFormValues,
): UpdateWarningRequestDto => ({
  hazard: values.hazard as HazardType,
  otherHazard: values.otherHazard,
  severity: values.severity as WarningSeverity,
  areaIds: values.areaIds,
  message: values.message,
  instructions: values.instructions,
  channels: values.channels,
});

const toFormRequest = (values: WarningFormValues): WarningFormRequestDto => ({
  sourceReportId: values.sourceReportId,
  ...toUpdateRequest(values),
});

export interface SubmitOptions {
  createdBy: string;
  draftId?: string;
}

export const toSubmitRequest = (
  values: WarningFormValues,
  { createdBy, draftId }: SubmitOptions,
): SubmitWarningRequestDto => ({
  ...toFormRequest(values),
  createdBy,
  ...(draftId ? { draftId } : {}),
});
