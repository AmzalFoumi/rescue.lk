import type { DistrictDto } from '@rescue-lk/shared';
import type { LocationDraft } from '../domain/report-draft';
import { INPUT_CLASS, CARD_CLASS } from './tone-classes';

type ManualLocation = Extract<LocationDraft, { source: 'manual' }>;

interface ManualLocationPanelProps {
  location: ManualLocation;
  districts: readonly DistrictDto[];
  onChange: (location: ManualLocation) => void;
  onUseGps: () => void;
}

/** A district and the nearest town or landmark, for when GPS is not available (extension 5.a). */
export function ManualLocationPanel({
  location,
  districts,
  onChange,
  onUseGps,
}: ManualLocationPanelProps) {
  return (
    <div className={`${CARD_CLASS} space-y-3`}>
      <div>
        <label htmlFor="district" className="mb-1 block font-semibold">
          District
        </label>
        <select
          id="district"
          value={location.districtId}
          onChange={(event) =>
            onChange({ ...location, districtId: event.target.value })
          }
          className={INPUT_CLASS}
        >
          <option value="">Choose district</option>
          {districts.map((district) => (
            <option key={district.id} value={district.id}>
              {district.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="landmark" className="mb-1 block font-semibold">
          Nearest town or landmark
        </label>
        <input
          id="landmark"
          value={location.landmark}
          onChange={(event) =>
            onChange({ ...location, landmark: event.target.value })
          }
          className={INPUT_CLASS}
        />
      </div>
      <button
        type="button"
        onClick={onUseGps}
        className="font-semibold text-primary underline"
      >
        Use my GPS location
      </button>
    </div>
  );
}
