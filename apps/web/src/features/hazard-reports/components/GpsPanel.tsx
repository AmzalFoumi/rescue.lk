import { formatCoordinates } from '../domain/format';
import type { GpsFix } from '../domain/report-draft';
import { useGeolocation } from '../hooks/use-geolocation';
import { Button } from './Button';
import { CARD_CLASS } from './tone-classes';

interface GpsPanelProps {
  fix: GpsFix | null;
  onFix: (fix: GpsFix) => void;
  onEnterManually: () => void;
}

/** Asks the phone for its position as soon as it appears (scenario step: captureLocation). */
export function GpsPanel({ fix, onFix, onEnterManually }: GpsPanelProps) {
  const { status, locate } = useGeolocation(onFix);

  return (
    <div className={`${CARD_CLASS} space-y-3`}>
      <p className="font-semibold">Use current location (GPS)</p>
      {status === 'locating' && <p role="status">Getting your location…</p>}
      {status === 'ready' && fix && (
        <p>
          {formatCoordinates(fix.latitude, fix.longitude)}
          {fix.accuracyMetres !== undefined &&
            ` · accurate to ${fix.accuracyMetres} m`}
        </p>
      )}
      {status === 'unavailable' && (
        <div className="space-y-2">
          <p role="alert">We could not get your location.</p>
          <Button variant="outline" onClick={locate}>
            Try again
          </Button>
        </div>
      )}
      <button
        type="button"
        onClick={onEnterManually}
        className="font-semibold text-primary underline"
      >
        Enter location manually instead
      </button>
    </div>
  );
}
