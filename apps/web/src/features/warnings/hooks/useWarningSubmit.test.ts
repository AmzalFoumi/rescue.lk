import { act, renderHook } from '@testing-library/react';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import type { WarningDto } from '@rescue-lk/shared';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/api-error';
import { CREATED_BY } from '../constants';
import { EMPTY_FORM, type WarningFormValues } from '../form';
import type { Editor } from './useWorkflowNavigation';
import { useWarningSubmit } from './useWarningSubmit';

vi.mock('@/lib/api', () => ({
  api: {
    warnings: { saveDraft: vi.fn(), publish: vi.fn(), update: vi.fn() },
  },
}));

const warningsApi = vi.mocked(api.warnings);
const WARNING_ID = '665f1b2c9d3e4a0012345670';
const REPORT_ID = '665f1b2c9d3e4a00000000a1';

const values: WarningFormValues = {
  ...EMPTY_FORM,
  sourceReportId: REPORT_ID,
  hazard: 'FLOOD',
  severity: 'HIGH',
  areaIds: ['B-KALU'],
  message: 'The Kalu Ganga is rising quickly.',
  instructions: 'Move to higher ground.',
  channels: ['SMS', 'PUSH'],
};

const saved = {
  id: WARNING_ID,
  sourceReportId: REPORT_ID,
  channels: ['SMS', 'PUSH'],
} as WarningDto;

const setup = (editor: Editor | null) => {
  const deps = {
    editor,
    values,
    setErrors: vi.fn(),
    openDelivery: vi.fn(),
    toMonitor: vi.fn(),
    afterChange: vi.fn(),
    notify: vi.fn(),
    onDraftSaved: vi.fn(),
  };
  const { result } = renderHook(() => useWarningSubmit(deps));
  return { deps, result };
};

const fieldError = new ApiError({
  status: 400,
  message: 'Warning failed validation',
  fieldErrors: { message: 'Write a message of at least 20 characters.' },
});

describe('useWarningSubmit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveDraft', () => {
    it('saves a new draft, then returns to monitoring with a toast', async () => {
      warningsApi.saveDraft.mockResolvedValue(saved);
      const { deps, result } = setup({ mode: 'create' });

      await act(() => result.current.saveDraft());

      expect(warningsApi.saveDraft).toHaveBeenCalledWith({
        ...values,
        createdBy: CREATED_BY,
      });
      expect(deps.afterChange).toHaveBeenCalled();
      expect(deps.onDraftSaved).toHaveBeenCalled();
      expect(deps.toMonitor).toHaveBeenCalled();
      expect(deps.notify).toHaveBeenCalledWith(
        'Draft W-345670 saved. It has not been sent to citizens.',
      );
    });

    it('saves over the open draft', async () => {
      warningsApi.saveDraft.mockResolvedValue(saved);
      const { result } = setup({ mode: 'draft', warningId: WARNING_ID });

      await act(() => result.current.saveDraft());

      expect(warningsApi.saveDraft).toHaveBeenCalledWith(
        expect.objectContaining({ draftId: WARNING_ID }),
      );
    });

    it('shows the API field errors and stays on the step', async () => {
      warningsApi.saveDraft.mockRejectedValue(fieldError);
      const { deps, result } = setup({ mode: 'create' });

      await act(() => result.current.saveDraft());

      expect(deps.setErrors).toHaveBeenCalledWith(fieldError.fieldErrors);
      expect(deps.toMonitor).not.toHaveBeenCalled();
      expect(result.current.failure).toBe(fieldError);
    });
  });

  describe('confirm (publish or update)', () => {
    it('publishes a new warning and opens its delivery status', async () => {
      warningsApi.publish.mockResolvedValue({ warning: saved, deliveries: [] });
      const { deps, result } = setup({ mode: 'create' });

      let ok = false;
      await act(async () => {
        ok = await result.current.confirm();
      });

      expect(ok).toBe(true);
      expect(warningsApi.publish).toHaveBeenCalledWith({
        ...values,
        createdBy: CREATED_BY,
      });
      expect(deps.openDelivery).toHaveBeenCalledWith(WARNING_ID, REPORT_ID);
      expect(deps.notify).toHaveBeenCalledWith(
        'W-345670 published. Sending on 2 channels.',
      );
    });

    it('publishes the open draft', async () => {
      warningsApi.publish.mockResolvedValue({ warning: saved, deliveries: [] });
      const { result } = setup({ mode: 'draft', warningId: WARNING_ID });

      await act(() => result.current.confirm());

      expect(warningsApi.publish).toHaveBeenCalledWith(
        expect.objectContaining({ draftId: WARNING_ID }),
      );
    });

    it('sends an update of an ACTIVE warning without its source report', async () => {
      warningsApi.update.mockResolvedValue({ warning: saved, deliveries: [] });
      const { deps, result } = setup({ mode: 'update', warningId: WARNING_ID });

      await act(() => result.current.confirm());

      const [id, body] = warningsApi.update.mock.calls[0];
      expect(id).toBe(WARNING_ID);
      expect(body).not.toHaveProperty('sourceReportId');
      expect(deps.notify).toHaveBeenCalledWith(
        'W-345670 updated. Sending on 2 channels.',
      );
    });

    it('reports failure with the field errors', async () => {
      warningsApi.publish.mockRejectedValue(fieldError);
      const { deps, result } = setup({ mode: 'create' });

      let ok = true;
      await act(async () => {
        ok = await result.current.confirm();
      });

      expect(ok).toBe(false);
      expect(deps.setErrors).toHaveBeenCalledWith(fieldError.fieldErrors);
      expect(deps.openDelivery).not.toHaveBeenCalled();
    });
  });

  it('tracks the action in progress', async () => {
    let finish: (value: WarningDto) => void = () => undefined;
    warningsApi.saveDraft.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const { result } = setup({ mode: 'create' });

    let pending: Promise<unknown> = Promise.resolve();
    act(() => {
      pending = result.current.saveDraft();
    });
    expect(result.current.pending).toBe('saveDraft');

    await act(async () => {
      finish(saved);
      await pending;
    });
    expect(result.current.pending).toBeNull();
  });
});
