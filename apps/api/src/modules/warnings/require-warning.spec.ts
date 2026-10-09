import { describe, it, expect, vi } from 'vitest';
import { requireWarning } from './require-warning.js';
import { WarningNotFoundException } from './exceptions/warning-not-found.exception.js';
import { WARNING_ID, buildWarningRecord } from './testing/warning.fixtures.js';

describe('requireWarning', () => {
  it('returns the warning when it exists', async () => {
    const warning = buildWarningRecord();
    const findById = vi.fn().mockResolvedValue(warning);

    await expect(requireWarning({ findById }, WARNING_ID)).resolves.toBe(
      warning,
    );
    expect(findById).toHaveBeenCalledWith(WARNING_ID);
  });

  it('throws WarningNotFoundException when it does not', async () => {
    const findById = vi.fn().mockResolvedValue(null);

    await expect(requireWarning({ findById }, WARNING_ID)).rejects.toThrow(
      WarningNotFoundException,
    );
  });
});
