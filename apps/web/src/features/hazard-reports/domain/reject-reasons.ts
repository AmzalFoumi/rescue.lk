export type RejectReasonValue =
  | 'duplicate'
  | 'not_a_hazard'
  | 'insufficient_information'
  | 'location_unconfirmed'
  | 'other';

export interface RejectReasonOption {
  value: RejectReasonValue;
  label: string;
}

/** The reasons an operator can choose from. Add a row to add a reason. */
export const REJECT_REASONS: readonly RejectReasonOption[] = [
  { value: 'duplicate', label: 'Duplicate of an existing report' },
  { value: 'not_a_hazard', label: 'Not a hazard' },
  { value: 'insufficient_information', label: 'Insufficient information' },
  { value: 'location_unconfirmed', label: 'Location could not be confirmed' },
  { value: 'other', label: 'Other' },
];

/** The API accepts a rejection reason of at most this many characters. */
export const MAX_REJECTION_LENGTH = 500;

export const REJECTION_MESSAGES = {
  chooseReason: 'Choose a reason. The citizen will see it in the app.',
  describeOther: 'Describe the reason in the details box.',
  tooLong: `Keep the reason under ${MAX_REJECTION_LENGTH} characters.`,
} as const;

/** The text stored with a rejection: "<reason>: <note>", or only the note for "other". */
export function composeRejectionReason(
  reason: RejectReasonValue,
  note: string,
): string {
  const trimmedNote = note.trim();
  if (reason === 'other') return trimmedNote;
  const label =
    REJECT_REASONS.find((option) => option.value === reason)?.label ?? reason;
  return trimmedNote === '' ? label : `${label}: ${trimmedNote}`;
}

/** An error message when the rejection cannot be sent, or null when it can. */
export function validateRejection(
  reason: RejectReasonValue | '',
  note: string,
): string | null {
  if (reason === '') return REJECTION_MESSAGES.chooseReason;
  if (reason === 'other' && note.trim() === '')
    return REJECTION_MESSAGES.describeOther;
  if (composeRejectionReason(reason, note).length > MAX_REJECTION_LENGTH)
    return REJECTION_MESSAGES.tooLong;
  return null;
}
