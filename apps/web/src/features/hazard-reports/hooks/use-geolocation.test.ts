import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useGeolocation, type GeolocationSource } from './use-geolocation';

const position = {
  coords: { latitude: 6.68281, longitude: 80.39921, accuracy: 12.4 },
};

describe('useGeolocation', () => {
  it('asks for the position when it starts and gives it to onFix', async () => {
    const onFix = vi.fn();
    const source: GeolocationSource = {
      getCurrentPosition: (success) => success(position),
    };

    const { result } = renderHook(() => useGeolocation(onFix, source));

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(onFix).toHaveBeenCalledWith({
      latitude: 6.68281,
      longitude: 80.39921,
      accuracyMetres: 12,
    });
  });

  it('is "locating" until the phone answers', () => {
    const source: GeolocationSource = { getCurrentPosition: () => {} };
    const { result } = renderHook(() => useGeolocation(vi.fn(), source));
    expect(result.current.status).toBe('locating');
  });

  it('becomes unavailable when the phone refuses', async () => {
    const source: GeolocationSource = {
      getCurrentPosition: (_success, error) => error(),
    };
    const { result } = renderHook(() => useGeolocation(vi.fn(), source));
    await waitFor(() => expect(result.current.status).toBe('unavailable'));
  });

  it('is unavailable when the browser has no geolocation', () => {
    const { result } = renderHook(() => useGeolocation(vi.fn(), undefined));
    expect(result.current.status).toBe('unavailable');
  });

  it('tries again on locate', async () => {
    const getCurrentPosition = vi
      .fn<GeolocationSource['getCurrentPosition']>()
      .mockImplementationOnce((_success, error) => error())
      .mockImplementationOnce((success) => success(position));
    // One source object for all renders, like navigator.geolocation in a browser.
    const source: GeolocationSource = { getCurrentPosition };
    const onFix = vi.fn();
    const { result } = renderHook(() => useGeolocation(onFix, source));
    await waitFor(() => expect(result.current.status).toBe('unavailable'));

    act(() => result.current.locate());

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(getCurrentPosition).toHaveBeenCalledTimes(2);
  });
});
