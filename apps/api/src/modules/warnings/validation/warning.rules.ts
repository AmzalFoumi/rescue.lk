import type { WarningFormField } from '@rescue-lk/shared';
import type { WarningForm } from '../domain/warning-form.js';
import type { TargetAreaCatalog } from '../target-areas/target-area-catalog.interface.js';
import {
  HAZARD_TYPES,
  OTHER_HAZARD,
  WARNING_MESSAGE_MIN_LENGTH,
  WARNING_SEVERITIES,
} from '../warnings.constants.js';

// DRAFT is less strict: a draft may be saved before instructions and channels
// are chosen. PUBLISH requires everything.
export type ValidationMode = 'DRAFT' | 'PUBLISH';

export interface RuleInput {
  form: WarningForm;
  areas: TargetAreaCatalog;
}

// A rule returns an error message for its field, or null when the form passes.
// New rules are added to WARNING_RULES without changing the validator (OCP).
export interface WarningRule {
  field: WarningFormField;
  modes: readonly ValidationMode[];
  check(input: RuleInput): string | null;
}

const ALL_MODES: readonly ValidationMode[] = ['DRAFT', 'PUBLISH'];
const PUBLISH_ONLY: readonly ValidationMode[] = ['PUBLISH'];

const isBlank = (value: string): boolean => value.trim().length === 0;

const checkAreas = ({ form, areas }: RuleInput): string | null => {
  if (form.areaIds.length === 0) {
    return 'Add at least one district or river basin.';
  }
  const unknown = areas.findUnknown(form.areaIds);
  return unknown.length > 0 ? `Unknown area(s): ${unknown.join(', ')}.` : null;
};

export const WARNING_RULES: readonly WarningRule[] = [
  {
    field: 'hazard',
    modes: ALL_MODES,
    check: ({ form }) =>
      HAZARD_TYPES.includes(form.hazard) ? null : 'Choose a hazard type.',
  },
  {
    field: 'otherHazard',
    modes: ALL_MODES,
    check: ({ form }) =>
      form.hazard === OTHER_HAZARD && isBlank(form.otherHazard)
        ? 'Name the hazard.'
        : null,
  },
  {
    field: 'severity',
    modes: ALL_MODES,
    check: ({ form }) =>
      WARNING_SEVERITIES.includes(form.severity) ? null : 'Choose a severity.',
  },
  { field: 'areaIds', modes: ALL_MODES, check: checkAreas },
  {
    field: 'message',
    modes: ALL_MODES,
    check: ({ form }) =>
      form.message.trim().length >= WARNING_MESSAGE_MIN_LENGTH
        ? null
        : `Write a message of at least ${WARNING_MESSAGE_MIN_LENGTH} characters.`,
  },
  {
    field: 'instructions',
    modes: PUBLISH_ONLY,
    check: ({ form }) =>
      isBlank(form.instructions)
        ? 'Add at least one safety instruction.'
        : null,
  },
  {
    field: 'channels',
    modes: PUBLISH_ONLY,
    check: ({ form }) =>
      form.channels.length === 0 ? 'Select at least one channel.' : null,
  },
];
