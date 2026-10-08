import type { DraftErrors } from '../domain/report-draft';

/** "Fix 2 items to continue" with the list of problems, shown above the form. */
export function ErrorSummary({ errors }: { errors: DraftErrors }) {
  const messages = Object.values(errors);
  if (messages.length === 0) return null;

  return (
    <div
      role="alert"
      className="rounded-[10px] border border-danger-bd bg-danger-bg p-4 text-danger-fg"
    >
      <p className="font-semibold">
        Fix {messages.length === 1 ? '1 item' : `${messages.length} items`} to
        continue
      </p>
      <ul className="mt-1 list-disc pl-5 text-sm">
        {messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    </div>
  );
}
