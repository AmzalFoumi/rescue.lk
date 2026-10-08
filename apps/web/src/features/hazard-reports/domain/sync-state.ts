/** What the screen shows about sending the reports that were saved while offline. */
export type SyncState =
  | { phase: 'idle' }
  | { phase: 'syncing'; count: number }
  | { phase: 'done'; synced: number; stillQueued: number }
  | { phase: 'error'; message: string };
