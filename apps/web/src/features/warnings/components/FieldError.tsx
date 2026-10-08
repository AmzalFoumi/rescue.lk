import { CircleAlert } from 'lucide-react';
import { ICON_SIZE } from '../ui';

interface FieldErrorProps {
  id: string;
  message?: string;
}

// FieldError shows the error text under one input.
// Accessibility: the input links to it with aria-describedby, so screen readers read
// the error with the field.
// DRY: errorProps builds that link the same way for every field.
export function FieldError({ id, message }: FieldErrorProps) {
  if (!message) {
    return null;
  }
  return (
    <p
      id={id}
      className="mt-1 flex items-start gap-1 text-[12.5px] font-semibold text-[#9F1D1D]"
    >
      <CircleAlert aria-hidden size={ICON_SIZE.small} className="mt-px" />
      {message}
    </p>
  );
}

// Props that connect an input to its error message.
export const errorProps = (errorId: string, message?: string) => ({
  'aria-invalid': message ? true : undefined,
  'aria-describedby': message ? errorId : undefined,
});
