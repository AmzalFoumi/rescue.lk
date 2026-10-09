import { Injectable } from '@nestjs/common';

// DI token for the Clock.
export const CLOCK = Symbol('CLOCK');

// Clock gives services the current time.
// DIP: services ask this interface instead of calling new Date() themselves, so tests
// can fix "now" and check publishedAt, updatedAt and cancelledAt exactly.
// SystemClock is the real implementation, bound in warnings.module.ts.
export interface Clock {
  now(): Date;
}

@Injectable()
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
