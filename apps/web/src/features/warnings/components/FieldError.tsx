import { CircleAlert } from 'lucide-react';
import { ICON_SIZE } from '../ui';

interface FieldErrorProps {
  id: string;
  message?: string;
}

// Error text under one input; the input points to it with aria-describedby.
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
