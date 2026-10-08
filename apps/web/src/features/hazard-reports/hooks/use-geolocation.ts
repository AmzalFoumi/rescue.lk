'use client';

import { useCallback, useEffect, useState } from 'react';
import type { GpsFix } from '../domain/report-draft';

export type GeolocationStatus = 'locating' | 'ready' | 'unavailable';

/** The part of the browser's geolocation that we use (lets tests pass a fake). */
export interface GeolocationSource {
  getCurrentPosition(
    onSuccess: (position: {
      coords: { latitude: number; longitude: number; accuracy: number };
    }) => void,
    onError: () => void,
    options?: { enableHighAccuracy?: boolean; timeout?: number },
  ): void;
}

const GEOLOCATION_TIMEOUT_MS = 10_000;

function browserGeolocation(): GeolocationSource | undefined {
  return typeof navigator === 'undefined' ? undefined : navigator.geolocation;
}

/**
 * Asks the phone for its position when the screen opens, and again on `locate`.
 * `onFix` must keep the same identity between renders (wrap it in useCallback).
 */
export function useGeolocation(
  onFix: (fix: GpsFix) => void,
  geolocation: GeolocationSource | undefined = browserGeolocation(),
): { status: GeolocationStatus; locate: () => void } {
  const [status, setStatus] = useState<GeolocationStatus>(() =>
    geolocation ? 'locating' : 'unavailable',
  );

  const request = useCallback(() => {
    geolocation?.getCurrentPosition(
      ({ coords }) => {
        onFix({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracyMetres: Math.round(coords.accuracy),
        });
        setStatus('ready');
      },
      () => setStatus('unavailable'),
      { enableHighAccuracy: true, timeout: GEOLOCATION_TIMEOUT_MS },
    );
  }, [geolocation, onFix]);

  useEffect(() => {
    request();
  }, [request]);

  const locate = useCallback(() => {
    setStatus('locating');
    request();
  }, [request]);

  return { status, locate };
}
