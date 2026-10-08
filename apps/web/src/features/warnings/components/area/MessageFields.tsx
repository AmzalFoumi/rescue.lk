import type { WarningFormErrors } from '@rescue-lk/shared';
import { INSTRUCTIONS_MAX_LENGTH, MESSAGE_MAX_LENGTH } from '../../constants';
import type { SetFormField } from '../../hooks/useWarningForm';
import { messageCountLabel } from '../../publishing';
import { cx, ui } from '../../ui';
import { FieldError } from '../FieldError';
import { Card } from '../shell/Card';

interface MessageFieldsProps {
  message: string;
  instructions: string;
  errors: WarningFormErrors;
  onFieldChange: SetFormField;
}

const MESSAGE_ID = 'warning-message';
const INSTRUCTIONS_ID = 'warning-instructions';

const textarea = (invalid: boolean) =>
  cx(
    ui.input,
    'resize-y leading-[1.45]',
    invalid ? ui.inputInvalid : ui.inputBorder,
  );

const describedBy = (...ids: (string | false)[]) =>
  ids.filter(Boolean).join(' ') || undefined;

// MessageFields is "3. Warning message": the message and the safety instructions.
// Presentational. Accessibility: each field is linked to its hint and its error with
// aria-describedby, so screen readers read them together.
export function MessageFields({
  message,
  instructions,
  errors,
  onFieldChange,
}: MessageFieldsProps) {
  return (
    <Card title="3. Warning message" titleId="warning-message-title">
      <div className="flex flex-col gap-3.5 p-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={MESSAGE_ID} className={ui.label}>
            Message
          </label>
          <textarea
            id={MESSAGE_ID}
            rows={4}
            value={message}
            maxLength={MESSAGE_MAX_LENGTH}
            onChange={(event) => onFieldChange('message', event.target.value)}
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={describedBy(
              `${MESSAGE_ID}-count`,
              !!errors.message && `${MESSAGE_ID}-error`,
            )}
            className={textarea(!!errors.message)}
          />
          <span id={`${MESSAGE_ID}-count`} className={ui.hint}>
            {messageCountLabel(message)}
          </span>
          <FieldError id={`${MESSAGE_ID}-error`} message={errors.message} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={INSTRUCTIONS_ID} className={ui.label}>
            Safety instructions
          </label>
          <textarea
            id={INSTRUCTIONS_ID}
            rows={4}
            value={instructions}
            maxLength={INSTRUCTIONS_MAX_LENGTH}
            onChange={(event) =>
              onFieldChange('instructions', event.target.value)
            }
            aria-invalid={errors.instructions ? true : undefined}
            aria-describedby={describedBy(
              `${INSTRUCTIONS_ID}-help`,
              !!errors.instructions && `${INSTRUCTIONS_ID}-error`,
            )}
            className={textarea(!!errors.instructions)}
          />
          <span id={`${INSTRUCTIONS_ID}-help`} className={ui.hint}>
            One instruction per line.
          </span>
          <FieldError
            id={`${INSTRUCTIONS_ID}-error`}
            message={errors.instructions}
          />
        </div>
      </div>
    </Card>
  );
}
