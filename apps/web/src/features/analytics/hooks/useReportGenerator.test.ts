import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReportGenerator } from './useReportGenerator';
import { generateReport, exportReport } from '@/lib/api';
import { downloadBlob } from '@/lib/download';
import { useDemoRole } from '../context/DemoRoleContext';

vi.mock('@/lib/api', () => ({
  generateReport: vi.fn(),
  exportReport: vi.fn(),
}));

vi.mock('@/lib/download', () => ({
  downloadBlob: vi.fn(),
}));

vi.mock('../context/DemoRoleContext', () => ({
  useDemoRole: vi.fn(),
}));

describe('useReportGenerator', () => {
  beforeEach(() => {
    vi.mocked(useDemoRole).mockReturnValue({
      role: 'DMC_ADMIN',
      setRole: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('generate sets loading then report', async () => {
    const mockReport = {
      type: 'CITIZENS_REACHED' as const,
      title: 'Test',
      description: '',
      generatedAt: '',
      filters: { from: 'a', to: 'b' },
      columns: [],
      rows: [],
    };
    vi.mocked(generateReport).mockResolvedValue(mockReport);

    const { result } = renderHook(() => useReportGenerator());

    let promise: Promise<void>;
    act(() => {
      promise = result.current.generate('CITIZENS_REACHED', {
        from: 'a',
        to: 'b',
      });
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();

    await act(async () => {
      await promise;
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.report).toEqual(mockReport);
    expect(generateReport).toHaveBeenCalledWith(
      { type: 'CITIZENS_REACHED', from: 'a', to: 'b' },
      'DMC_ADMIN',
    );
  });

  it('generate failure sets error', async () => {
    vi.mocked(generateReport).mockRejectedValue(new Error('Generation failed'));

    const { result } = renderHook(() => useReportGenerator());

    await act(async () => {
      await result.current.generate('CITIZENS_REACHED', { from: 'a', to: 'b' });
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Generation failed');
    expect(result.current.report).toBeNull();
  });

  it('generate failure sets fallback error when message is missing', async () => {
    vi.mocked(generateReport).mockRejectedValue({});

    const { result } = renderHook(() => useReportGenerator());

    await act(async () => {
      await result.current.generate('CITIZENS_REACHED', { from: 'a', to: 'b' });
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Failed to generate report');
  });

  it('exportAs downloads with the right file name and format', async () => {
    const mockBlob = new Blob(['csv data']);
    vi.mocked(exportReport).mockResolvedValue(mockBlob);

    const { result } = renderHook(() => useReportGenerator());

    await act(async () => {
      await result.current.exportAs('CITIZENS_REACHED', 'CSV', {
        from: 'a',
        to: 'b',
      });
    });

    expect(exportReport).toHaveBeenCalledWith(
      { type: 'CITIZENS_REACHED', format: 'CSV', from: 'a', to: 'b' },
      'DMC_ADMIN',
    );
    expect(downloadBlob).toHaveBeenCalledWith(mockBlob, 'citizens-reached.csv');
  });

  it('exportAs downloads PDF with the right file name and format', async () => {
    const mockBlob = new Blob(['pdf data']);
    vi.mocked(exportReport).mockResolvedValue(mockBlob);

    const { result } = renderHook(() => useReportGenerator());

    await act(async () => {
      await result.current.exportAs('CITIZENS_REACHED', 'PDF', {
        from: 'a',
        to: 'b',
      });
    });

    expect(downloadBlob).toHaveBeenCalledWith(mockBlob, 'citizens-reached.pdf');
  });

  it('exportAs failure sets error', async () => {
    vi.mocked(exportReport).mockRejectedValue(new Error('Export failed'));

    const { result } = renderHook(() => useReportGenerator());

    await act(async () => {
      await result.current.exportAs('CITIZENS_REACHED', 'CSV', {
        from: 'a',
        to: 'b',
      });
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Export failed');
  });

  it('exportAs failure sets fallback error when message is missing', async () => {
    vi.mocked(exportReport).mockRejectedValue({});

    const { result } = renderHook(() => useReportGenerator());

    await act(async () => {
      await result.current.exportAs('CITIZENS_REACHED', 'CSV', {
        from: 'a',
        to: 'b',
      });
    });

    expect(result.current.error).toBe('Failed to export as CSV');
  });
});
