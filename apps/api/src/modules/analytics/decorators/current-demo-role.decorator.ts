import {
  BadRequestException,
  createParamDecorator,
  type ExecutionContext,
} from '@nestjs/common';
import type { DemoRole } from '@rescue-lk/shared/analytics/report.types';
import { isDemoRole } from '../constants/role.constants.js';

/**
 * Prototype only: reads the mocked role from the x-demo-role header.
 * When real auth exists, replace this decorator with one that reads the user from the JWT/session.
 * Controller and service signatures stay the same.
 */
export const CurrentDemoRole = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): DemoRole => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | string[] | undefined> }>();
    const header = request.headers['x-demo-role'];

    if (typeof header === 'string' && isDemoRole(header)) {
      return header;
    }
    throw new BadRequestException('Missing or invalid x-demo-role header');
  },
);
