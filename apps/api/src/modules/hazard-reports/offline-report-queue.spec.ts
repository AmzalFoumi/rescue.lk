import { Logger } from '@nestjs/common';
import { describe, it, expect, vi } from 'vitest';
import { InMemoryOfflineReportQueue } from './offline-report-queue.js';
import type { ReportSubmission } from './report-submission.js';

const report = (description: string) => ({ description }) as ReportSubmission;

describe('InMemoryOfflineReportQueue', () => {
  it('starts empty', () => {
    expect(new InMemoryOfflineReportQueue().pendingCount()).toBe(0);
  });

  it('counts queued reports', () => {
    const queue = new InMemoryOfflineReportQueue();
    queue.enqueue(report('a'));
    queue.enqueue(report('b'));
    expect(queue.pendingCount()).toBe(2);
  });

  it('sends every report and empties the queue', async () => {
    const queue = new InMemoryOfflineReportQueue();
    queue.enqueue(report('a'));
    queue.enqueue(report('b'));
    const send = vi.fn().mockResolvedValue(undefined);

    const result = await queue.syncWhenOnline(send);

    expect(send).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ synced: 2, stillQueued: 0 });
    expect(queue.pendingCount()).toBe(0);
  });

  it('does nothing when the queue is empty', async () => {
    const send = vi.fn();
    const result = await new InMemoryOfflineReportQueue().syncWhenOnline(send);
    expect(send).not.toHaveBeenCalled();
    expect(result).toEqual({ synced: 0, stillQueued: 0 });
  });

  it('keeps a failed report queued and still sends the others', async () => {
    const queue = new InMemoryOfflineReportQueue();
    queue.enqueue(report('ok'));
    queue.enqueue(report('bad'));
    const send = vi.fn(async (r: ReportSubmission) => {
      if (r.description === 'bad') throw new Error('network down');
    });

    const result = await queue.syncWhenOnline(send);

    expect(result).toEqual({ synced: 1, stillQueued: 1 });
    expect(queue.pendingCount()).toBe(1);
  });

  it('logs a warning with the reason when a report fails to sync', async () => {
    const warn = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => {});
    const queue = new InMemoryOfflineReportQueue();
    queue.enqueue(report('bad'));

    await queue.syncWhenOnline(async () => {
      throw new Error('network down');
    });

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('network down'));
    warn.mockRestore();
  });
});
