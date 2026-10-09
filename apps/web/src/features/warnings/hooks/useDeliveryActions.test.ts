import { act, renderHook } from '@testing-library/react';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import type { DeliveryRecordDto } from '@rescue-lk/shared';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/api-error';
import { useDeliveryActions } from './useDeliveryActions';

vi.mock('@/lib/api', () => ({
  api: { warnings: { retryDelivery: vi.fn(), cancel: vi.fn() } },
}));

const warningsApi = vi.mocked(api.warnings);
const WARNING_ID = '665f1b2c9d3e4a0012345670';

const failed = (id: string) => ({ id, status: 'FAILED' }) as DeliveryRecordDto;

const setup = () => {
  const deps = {
    afterRetry: vi.fn(),
    afterCancel: vi.fn(),
    notify: vi.fn(),
  };
  const { result } = renderHook(() => useDeliveryActions(deps));
  return { deps, result };
};

describe('useDeliveryActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    warningsApi.retryDelivery.mockResolvedValue(failed('x'));
  });

  it('retries one delivery, then refreshes', async () => {
    const { deps, result } = setup();

    await act(() => result.current.retry('d1'));

    expect(warningsApi.retryDelivery).toHaveBeenCalledWith('d1');
    expect(deps.afterRetry).toHaveBeenCalled();
  });

  it('retries every failed channel together', async () => {
    const { deps, result } = setup();

    await act(() => result.current.retryAll([failed('d1'), failed('d2')]));

    expect(warningsApi.retryDelivery.mock.calls).toEqual([['d1'], ['d2']]);
    expect(deps.afterRetry).toHaveBeenCalledTimes(1);
    expect(deps.notify).toHaveBeenCalledWith('Retrying 2 failed channels.');
  });

  it('keeps a failed retry as the error to show, and still refreshes', async () => {
    const failure = new ApiError({ status: 409, message: 'it is SENT' });
    warningsApi.retryDelivery.mockRejectedValue(failure);
    const { deps, result } = setup();

    await act(() => result.current.retry('d1'));

    expect(result.current.retryError).toBe(failure);
    expect(deps.afterRetry).toHaveBeenCalled();
  });

  it('cancels with the reason and confirms it', async () => {
    warningsApi.cancel.mockResolvedValue({ id: WARNING_ID } as never);
    const { deps, result } = setup();

    let ok = false;
    await act(async () => {
      ok = await result.current.cancel(WARNING_ID, 'River level has fallen.');
    });

    expect(ok).toBe(true);
    expect(warningsApi.cancel).toHaveBeenCalledWith(WARNING_ID, {
      reason: 'River level has fallen.',
    });
    expect(deps.afterCancel).toHaveBeenCalled();
    expect(deps.notify).toHaveBeenCalledWith(
      'W-345670 cancelled. It no longer appears in the Citizen App.',
    );
  });

  it('keeps a failed cancel as the error to show in the dialog', async () => {
    const failure = new ApiError({
      status: 400,
      message: 'Warning failed validation',
      fieldErrors: { cancelReason: 'Give a reason for cancelling.' },
    });
    warningsApi.cancel.mockRejectedValue(failure);
    const { deps, result } = setup();

    let ok = true;
    await act(async () => {
      ok = await result.current.cancel(WARNING_ID, ' ');
    });

    expect(ok).toBe(false);
    expect(result.current.cancelError).toBe(failure);
    expect(deps.afterCancel).not.toHaveBeenCalled();
  });
});
