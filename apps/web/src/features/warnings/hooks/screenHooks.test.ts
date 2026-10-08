import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import type {
  TargetAreaDto,
  VerifiedHazardReportDto,
  WarningDto,
} from '@rescue-lk/shared';
import { api } from '@/lib/api';
import { useDeliveryScreen } from './useDeliveryScreen';
import { useLevelScreen } from './useLevelScreen';
import { usePublishReview } from './usePublishReview';

vi.mock('@/lib/api', () => ({
  api: {
    warnings: { reach: vi.fn(), deliveries: vi.fn(), cancel: vi.fn() },
  },
}));

const warningsApi = vi.mocked(api.warnings);
const WARNING_ID = '665f1b2c9d3e4a0012345670';

const areas: TargetAreaDto[] = [
  {
    id: 'D-RATNAPURA',
    kind: 'DISTRICT',
    name: 'Ratnapura District',
    districts: ['Ratnapura'],
  },
];
const report = {
  id: 'r1',
  districtName: 'Ratnapura',
  submittedAt: '2026-10-08T03:55:00.000Z',
} as VerifiedHazardReportDto;
const warning = {
  id: WARNING_ID,
  status: 'ACTIVE',
  severity: 'HIGH',
  version: 1,
  areaIds: ['D-RATNAPURA'],
  channels: ['SMS'],
  createdBy: 'Officer',
  createdAt: '2026-10-08T05:00:00.000Z',
  publishedAt: null,
  updatedAt: null,
  cancelledAt: null,
} as unknown as WarningDto;

describe('screen hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    warningsApi.reach.mockResolvedValue({
      districts: ['Ratnapura'],
      channels: [{ channel: 'SMS', recipients: 120000 }],
    });
    warningsApi.deliveries.mockResolvedValue([]);
  });

  describe('useLevelScreen', () => {
    it('finds the source report, its factors and its district SMS reach', async () => {
      const { result } = renderHook(() =>
        useLevelScreen({
          sourceReportId: 'r1',
          reports: [report],
          warnings: [],
          areas,
        }),
      );

      expect(result.current.sourceReport).toBe(report);
      expect(result.current.factors?.district).toBe('Ratnapura');
      await waitFor(() => expect(result.current.smsReach).toBe(120000));
      expect(warningsApi.reach).toHaveBeenCalledWith(['D-RATNAPURA']);
    });

    it('has nothing to show before a report is chosen', () => {
      const { result } = renderHook(() =>
        useLevelScreen({
          sourceReportId: '',
          reports: [report],
          warnings: [],
          areas,
        }),
      );

      expect(result.current).toMatchObject({
        sourceReport: undefined,
        factors: null,
        smsReach: null,
      });
      expect(warningsApi.reach).not.toHaveBeenCalled();
    });
  });

  describe('usePublishReview', () => {
    const submit = () => ({
      confirm: vi.fn().mockResolvedValue(true),
      saveDraft: vi.fn().mockResolvedValue(undefined),
      clearFailure: vi.fn(),
    });

    it('opens with a clean slate and closes after confirming', async () => {
      const deps = submit();
      const { result } = renderHook(() => usePublishReview(deps));

      act(() => result.current.start());
      expect(result.current.open).toBe(true);
      expect(deps.clearFailure).toHaveBeenCalled();

      await act(() => result.current.confirm());
      expect(deps.confirm).toHaveBeenCalled();
      expect(result.current.open).toBe(false);
    });

    it('closes and saves a draft from the review', () => {
      const deps = submit();
      const { result } = renderHook(() => usePublishReview(deps));
      act(() => result.current.start());

      act(() => result.current.saveDraft());

      expect(result.current.open).toBe(false);
      expect(deps.saveDraft).toHaveBeenCalled();
    });

    it('can be closed without doing anything', () => {
      const deps = submit();
      const { result } = renderHook(() => usePublishReview(deps));
      act(() => result.current.start());

      act(() => result.current.close());

      expect(result.current.open).toBe(false);
      expect(deps.confirm).not.toHaveBeenCalled();
    });
  });

  describe('useDeliveryScreen', () => {
    const setup = (warningId: string | null) => {
      const deps = { onCancelled: vi.fn(), notify: vi.fn() };
      const { result } = renderHook(() =>
        useDeliveryScreen({ warningId, warnings: [warning], areas, ...deps }),
      );
      return { deps, result };
    };

    it('builds the delivery view of the warning on screen', async () => {
      const { result } = setup(WARNING_ID);

      await waitFor(() => expect(result.current.view).not.toBeNull());
      expect(result.current.warning).toBe(warning);
      expect(warningsApi.deliveries).toHaveBeenCalledWith(WARNING_ID);
    });

    it('loads nothing when no warning is on screen', () => {
      const { result } = setup(null);

      expect(result.current.view).toBeNull();
      expect(warningsApi.deliveries).not.toHaveBeenCalled();
    });

    it('opens the cancel dialog and closes it once cancelled', async () => {
      warningsApi.cancel.mockResolvedValue(warning);
      const { deps, result } = setup(WARNING_ID);

      act(() => result.current.openCancel());
      expect(result.current.cancelling).toBe(true);

      await act(() => result.current.actions.cancel(WARNING_ID, 'Water down'));
      expect(result.current.cancelling).toBe(false);
      expect(deps.onCancelled).toHaveBeenCalled();
    });

    it('closes the cancel dialog without cancelling', () => {
      const { result } = setup(WARNING_ID);
      act(() => result.current.openCancel());

      act(() => result.current.closeCancel());

      expect(result.current.cancelling).toBe(false);
      expect(warningsApi.cancel).not.toHaveBeenCalled();
    });
  });
});
