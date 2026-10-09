import type { ReactNode } from 'react';

/** A short error message under a field. */
export function ErrorText({
  id,
  children,
}: {
  id?: string;
  children: ReactNode;
}) {
  return (
    <p id={id} className="mt-1 text-sm font-medium text-error">
      {children}
    </p>
  );
}
