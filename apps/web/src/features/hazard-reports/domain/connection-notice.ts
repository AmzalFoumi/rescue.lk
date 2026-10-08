import type { StatusTone } from './report-status';
import type { SyncState } from './sync-state';

/** The banner shown above the citizen screens. */
export interface ConnectionNotice {
  tone: StatusTone;
  text: string;
  /** Show a "Try again" button (sending failed). */
  canRetry: boolean;
  /** Show a "Dismiss" button (a finished message). */
  canDismiss: boolean;
}

function reports(count: number): string {
  return count === 1 ? '1 report' : `${count} reports`;
}

/** What to tell the reporter about the network and the saved reports, or null for nothing. */
export function describeConnection(
  online: boolean,
  sync: SyncState,
): ConnectionNotice | null {
  if (!online) {
    return {
      tone: 'neutral',
      text: 'You are offline. New reports are saved on this phone and sent automatically when you reconnect.',
      canRetry: false,
      canDismiss: false,
    };
  }
  switch (sync.phase) {
    case 'idle':
      return null;
    case 'syncing':
      return {
        tone: 'neutral',
        text: `Back online. Sending ${reports(sync.count)}…`,
        canRetry: false,
        canDismiss: false,
      };
    case 'error':
      return {
        tone: 'danger',
        text: `Could not send the saved reports. ${sync.message}`,
        canRetry: true,
        canDismiss: false,
      };
    case 'done':
      return describeFinishedSync(sync.synced, sync.stillQueued);
  }
}

function describeFinishedSync(
  synced: number,
  stillQueued: number,
): ConnectionNotice {
  if (stillQueued > 0) {
    return {
      tone: 'caution',
      text: `${reports(stillQueued)} could not be sent. They stay saved and will be retried.`,
      canRetry: true,
      canDismiss: false,
    };
  }
  return {
    tone: 'success',
    text: `${reports(synced)} sent. Status is now Pending Verification.`,
    canRetry: false,
    canDismiss: true,
  };
}
