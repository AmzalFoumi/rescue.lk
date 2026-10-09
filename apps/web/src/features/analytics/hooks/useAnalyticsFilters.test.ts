import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnalyticsFilters } from './useAnalyticsFilters';

describe('useAnalyticsFilters', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-09T10:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useAnalyticsFilters());

    expect(result.current.from).toBe('2026-09-09');
    expect(result.current.to).toBe('2026-10-09');
    expect(result.current.district).toBe('All districts');
    expect(result.current.hazardType).toBe('All hazards');
  });

  it('should omit district and hazardType when they are "All districts" or "All hazards" in buildRequest', () => {
    const { result } = renderHook(() => useAnalyticsFilters());

    const request = result.current.buildRequest();

    expect(request.from).toBe('2026-09-09');
    expect(request.to).toBe('2026-10-09');
    expect(request.district).toBeUndefined();
    expect(request.hazardType).toBeUndefined();
  });

  it('should include district and hazardType when they are not "All" in buildRequest', () => {
    const { result } = renderHook(() => useAnalyticsFilters());

    act(() => {
      result.current.setDistrict('Colombo');
      result.current.setHazardType('Flood');
      result.current.setFrom('2026-10-01');
      result.current.setTo('2026-10-05');
    });

    const request = result.current.buildRequest();

    expect(request.from).toBe('2026-10-01');
    expect(request.to).toBe('2026-10-05');
    expect(request.district).toBe('Colombo');
    expect(request.hazardType).toBe('Flood');
  });
});
