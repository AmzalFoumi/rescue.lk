import { Field, INPUT_CLASS } from '../../response/components/ui';

export interface AnalyticsFiltersState {
  from: string;
  setFrom: (v: string) => void;
  to: string;
  setTo: (v: string) => void;
  district: string;
  setDistrict: (v: string) => void;
  hazardType: string;
  setHazardType: (v: string) => void;
}

export function AnalyticsFilterBar({
  filters,
}: {
  filters: AnalyticsFiltersState;
}) {
  return (
    <div className="flex flex-wrap items-start gap-4">
      <div className="flex-1 min-w-[150px]">
        <Field id="from-date" label="From Date">
          <input
            id="from-date"
            type="date"
            value={filters.from}
            onChange={(e) => filters.setFrom(e.target.value)}
            className={INPUT_CLASS}
          />
        </Field>
      </div>
      <div className="flex-1 min-w-[150px]">
        <Field id="to-date" label="To Date">
          <input
            id="to-date"
            type="date"
            value={filters.to}
            onChange={(e) => filters.setTo(e.target.value)}
            className={INPUT_CLASS}
          />
        </Field>
      </div>
      <div className="flex-1 min-w-[150px]">
        <Field id="district" label="District">
          <select
            id="district"
            value={filters.district}
            onChange={(e) => filters.setDistrict(e.target.value)}
            className={INPUT_CLASS}
          >
            <option>All districts</option>
            <option>Colombo</option>
            <option>Kegalle</option>
            <option>Ratnapura</option>
            <option>Galle</option>
            <option>Kalutara</option>
          </select>
        </Field>
      </div>
      <div className="flex-1 min-w-[150px]">
        <Field id="hazard-type" label="Hazard Type">
          <select
            id="hazard-type"
            value={filters.hazardType}
            onChange={(e) => filters.setHazardType(e.target.value)}
            className={INPUT_CLASS}
          >
            <option>All hazards</option>
            <option>Flood</option>
            <option>Landslide</option>
          </select>
        </Field>
      </div>
    </div>
  );
}
