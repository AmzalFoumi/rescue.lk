import { describe, afterEach, it, expect, vi } from 'vitest';
import { SystemClock } from './clock.js';

describe('SystemClock', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the current system time', () => {
    const current = new Date('2026-10-08T12:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(current);

    expect(new SystemClock().now()).toEqual(current);
  });
});
