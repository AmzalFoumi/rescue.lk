import { describe, it, expect } from 'vitest';
import { CurrentDemoRole } from './current-demo-role.decorator.js';
import { BadRequestException, ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants.js';

describe('CurrentDemoRole', () => {
  // Helper to extract the factory function from the decorator
  function getParamDecoratorFactory(decorator: Function) {
    class Test {
      public test(@decorator() value: any) {}
    }
    const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, Test, 'test');
    return args[Object.keys(args)[0]].factory;
  }

  const factory = getParamDecoratorFactory(CurrentDemoRole);

  function createMockCtx(
    headers: Record<string, string | string[] | undefined>,
  ) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ headers }),
      }),
    } as unknown as ExecutionContext;
  }

  it('valid header returns role', () => {
    const ctx = createMockCtx({ 'x-demo-role': 'DMC_ADMIN' });
    expect(factory(null, ctx)).toBe('DMC_ADMIN');
  });

  it('missing header throws BadRequestException', () => {
    const ctx = createMockCtx({});
    expect(() => factory(null, ctx)).toThrow(BadRequestException);
  });

  it('invalid header value throws BadRequestException', () => {
    const ctx = createMockCtx({ 'x-demo-role': 'INVALID_ROLE' });
    expect(() => factory(null, ctx)).toThrow(BadRequestException);
  });

  it('array header value throws BadRequestException', () => {
    const ctx = createMockCtx({
      'x-demo-role': ['DMC_ADMIN', 'DONOR_ORGANISATION'],
    });
    expect(() => factory(null, ctx)).toThrow(BadRequestException);
  });
});
