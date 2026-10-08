import { describeConnection } from '../domain/connection-notice';
import type { SyncState } from '../domain/sync-state';
import { Button } from './Button';
import { TONE_CLASSES } from './tone-classes';

interface ConnectionBannerProps {
  online: boolean;
  syncState: SyncState;
  onRetry: () => void;
  onDismiss: () => void;
}

/** The message above the citizen screens: offline, sending, sent, or could not send. */
export function ConnectionBanner({
  online,
  syncState,
  onRetry,
  onDismiss,
}: ConnectionBannerProps) {
  const notice = describeConnection(online, syncState);
  if (notice === null) return null;

  return (
    <div
      role="status"
      className={`flex flex-wrap items-center gap-3 rounded-[10px] border p-3 ${TONE_CLASSES[notice.tone]}`}
    >
      <p className="min-w-0 flex-1">{notice.text}</p>
      {notice.canRetry && (
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
      {notice.canDismiss && (
        <Button variant="outline" onClick={onDismiss}>
          Dismiss
        </Button>
      )}
    </div>
  );
}
