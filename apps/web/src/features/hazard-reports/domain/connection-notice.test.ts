import { describe, expect, it } from 'vitest';
import { describeConnection } from './connection-notice';

const idle = { phase: 'idle' } as const;

describe('describeConnection', () => {
  it('says nothing when online and idle', () => {
    expect(describeConnection(true, idle)).toBeNull();
  });

  it('tells the reporter that reports are saved on the phone while offline', () => {
    const notice = describeConnection(false, idle);
    expect(notice?.text).toContain('You are offline');
    expect(notice).toMatchObject({ tone: 'neutral', canRetry: false });
  });

  it('keeps the offline message even if an old sync result is around', () => {
    expect(
      describeConnection(false, { phase: 'done', synced: 1, stillQueued: 0 })
        ?.text,
    ).toContain('You are offline');
  });

  it('shows how many saved reports are being sent', () => {
    expect(describeConnection(true, { phase: 'syncing', count: 1 })?.text).toBe(
      'Back online. Sending 1 report…',
    );
    expect(describeConnection(true, { phase: 'syncing', count: 3 })?.text).toBe(
      'Back online. Sending 3 reports…',
    );
  });

  it('confirms the reports that were sent', () => {
    const notice = describeConnection(true, {
      phase: 'done',
      synced: 2,
      stillQueued: 0,
    });
    expect(notice).toMatchObject({
      tone: 'success',
      text: '2 reports sent. Status is now Pending Verification.',
      canDismiss: true,
      canRetry: false,
    });
  });

  it('explains a partial failure and offers to try again (scenario 9.b)', () => {
    const notice = describeConnection(true, {
      phase: 'done',
      synced: 1,
      stillQueued: 1,
    });
    expect(notice).toMatchObject({
      tone: 'caution',
      text: '1 report could not be sent. They stay saved and will be retried.',
      canRetry: true,
      canDismiss: false,
    });
  });

  it('shows the error when sending failed completely', () => {
    const notice = describeConnection(true, {
      phase: 'error',
      message: 'Could not reach the server.',
    });
    expect(notice).toMatchObject({ tone: 'danger', canRetry: true });
    expect(notice?.text).toContain('Could not reach the server.');
  });
});
