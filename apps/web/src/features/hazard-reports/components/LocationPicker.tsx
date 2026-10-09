import { useCallback } from 'react';
import type { DistrictDto } from '@rescue-lk/shared';
import type { GpsFix, LocationDraft } from '../domain/report-draft';
import { ErrorText } from './ErrorText';
import { GpsPanel } from './GpsPanel';
import { ManualLocationPanel } from './ManualLocationPanel';

interface LocationPickerProps {
  location: LocationDraft | null;
  districts: readonly DistrictDto[];
  error?: string;
  /** `onChange` must keep the same identity between renders (wrap it in useCallback). */
  onChange: (location: LocationDraft | null) => void;
}

/** Shows the GPS panel by default, or the manual panel after "Enter location manually instead". */
export function LocationPicker({
  location,
  districts,
  error,
  onChange,
}: LocationPickerProps) {
  const handleFix = useCallback(
    (fix: GpsFix) => onChange({ source: 'gps', fix }),
    [onChange],
  );

  return (
    <div>
      {location?.source === 'manual' ? (
        <ManualLocationPanel
          location={location}
          districts={districts}
          onChange={onChange}
          onUseGps={() => onChange(null)}
        />
      ) : (
        <GpsPanel
          fix={location?.source === 'gps' ? location.fix : null}
          onFix={handleFix}
          onEnterManually={() =>
            onChange({ source: 'manual', districtId: '', landmark: '' })
          }
        />
      )}
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}
