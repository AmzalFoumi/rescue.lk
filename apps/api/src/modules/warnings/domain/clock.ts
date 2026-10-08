import { Injectable } from '@nestjs/common';

// Source of "now", injected so time-dependent logic is deterministic in tests.
export const CLOCK = Symbol('CLOCK');

export interface Clock {
  now(): Date;
}

@Injectable()
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
