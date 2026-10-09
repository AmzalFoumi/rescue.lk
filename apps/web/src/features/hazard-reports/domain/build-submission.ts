import type {
  DistrictDto,
  LocationDto,
  SubmitHazardReportRequest,
} from '@rescue-lk/shared';
import type { CitizenIdentity } from './identities';
import { mockPhotoUrl } from './photo-url';
import type { LocationDraft, ReportDraft } from './report-draft';

export interface SubmissionContext {
  reporter: CitizenIdentity;
  /** The reporter's home district. GPS reports are filed under it. */
  homeDistrict: DistrictDto;
  districts: readonly DistrictDto[];
  now: Date;
}

interface ResolvedPlace {
  district: DistrictDto;
  coordinates: LocationDto;
  placeName?: string;
}

// GPS: the phone's position, filed under the reporter's home district.
// Manual: the centre of the chosen district, with the typed landmark as the place name.
function resolvePlace(
  location: LocationDraft,
  context: SubmissionContext,
): ResolvedPlace {
  if (location.source === 'gps') {
    return {
      district: context.homeDistrict,
      coordinates: {
        latitude: location.fix.latitude,
        longitude: location.fix.longitude,
      },
    };
  }
  const district = context.districts.find(
    (candidate) => candidate.id === location.districtId,
  );
  if (!district) {
    throw new Error(`Unknown district: ${location.districtId}`);
  }
  return {
    district,
    coordinates: { latitude: district.latitude, longitude: district.longitude },
    placeName: location.landmark.trim(),
  };
}

/** Turns a finished form into the request the API expects. */
export function buildSubmission(
  draft: ReportDraft,
  context: SubmissionContext,
): SubmitHazardReportRequest {
  const { hazardType, location } = draft;
  if (hazardType === null || location === null) {
    throw new Error('Cannot build a report from an incomplete draft.');
  }
  const place = resolvePlace(location, context);

  return {
    hazardType,
    description: draft.description.trim(),
    ...(hazardType === 'other'
      ? { otherHazard: draft.otherHazard.trim() }
      : {}),
    ...(draft.photo ? { photoUrl: mockPhotoUrl(draft.photo.fileName) } : {}),
    ...(place.placeName ? { placeName: place.placeName } : {}),
    reporterName: context.reporter.name,
    location: place.coordinates,
    district: place.district.id,
    capturedAt: context.now.toISOString(),
    reporterId: context.reporter.id,
    reporterRole: 'citizen',
  };
}
