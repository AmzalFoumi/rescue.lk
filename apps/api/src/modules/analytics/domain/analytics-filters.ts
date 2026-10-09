export interface AnalyticsFilters {
  from: Date;
  to: Date;
  hazardType?: string; // undefined = all
  district?: string; // undefined = all
}
