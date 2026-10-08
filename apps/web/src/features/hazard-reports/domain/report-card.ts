import type {
  DistrictDto,
  HazardReportDto,
  HazardReportStatus,
} from '@rescue-lk/shared';
import { formatCoordinates, formatDateTime } from './format';
import {
  findHazardType,
  hazardTitle,
  type HazardIconName,
} from './hazard-types';
import { displayName } from './identities';
import type { QueuedReport } from './queued-report';
import { shortReportId } from './report-id';

/** Everything a My Reports card shows, worked out once so the card stays simple. */
export interface ReportCardModel {
  key: string;
  title: string;
  icon: HazardIconName;
  /** Short id like "R-8E36". Reports that are still on the phone have none. */
  shortId?: string;
  place: string;
  time: string;
  description: string;
  status: HazardReportStatus;
  /** Extra lines under the description (decision, reason, saved-on-phone notice). */
  notes: string[];
  possibleDuplicate: boolean;
}

export const DUPLICATE_NOTICE =
  'Possible duplicate. A similar report was made nearby. Operators will review them together.';
export const QUEUED_NOTICE =
  'Saved on this phone. It will be sent when you are back online.';

function districtName(
  districts: readonly DistrictDto[],
  id: string,
): string | undefined {
  return districts.find((district) => district.id === id)?.name;
}

/** A readable place: the typed landmark, else the district, else the coordinates. */
export function describePlace(
  report: {
    placeName?: string;
    district: string;
    location: { latitude: number; longitude: number };
  },
  districts: readonly DistrictDto[],
): string {
  const district = districtName(districts, report.district);
  if (report.placeName && district) return `${report.placeName}, ${district}`;
  if (report.placeName) return report.placeName;
  return (
    district ??
    formatCoordinates(report.location.latitude, report.location.longitude)
  );
}

function decisionNotes(report: HazardReportDto): string[] {
  if (report.status === 'verified' && report.verifiedBy && report.verifiedAt) {
    return [
      `Verified by ${displayName(report.verifiedBy)} on ${formatDateTime(report.verifiedAt)}.`,
    ];
  }
  if (report.status === 'rejected') {
    const by =
      report.verifiedBy && report.verifiedAt
        ? `${displayName(report.verifiedBy)} · ${formatDateTime(report.verifiedAt)}`
        : '';
    return [
      `Reason: ${report.rejectionReason ?? 'not given'}`,
      ...(by ? [by] : []),
    ];
  }
  return [];
}

export function toReportCard(
  report: HazardReportDto,
  districts: readonly DistrictDto[],
): ReportCardModel {
  return {
    key: report.id,
    title: hazardTitle(report.hazardType, report.otherHazard),
    icon: findHazardType(report.hazardType).icon,
    shortId: shortReportId(report.id),
    place: describePlace(report, districts),
    time: formatDateTime(report.capturedAt),
    description: report.description,
    status: report.status,
    notes: decisionNotes(report),
    possibleDuplicate:
      report.status === 'pending_verification' &&
      report.possibleDuplicateOf.length > 0,
  };
}

export function queuedToReportCard(
  queued: QueuedReport,
  districts: readonly DistrictDto[],
): ReportCardModel {
  const { request } = queued;
  return {
    key: queued.localId,
    title: hazardTitle(request.hazardType, request.otherHazard),
    icon: findHazardType(request.hazardType).icon,
    place: describePlace(request, districts),
    time: formatDateTime(request.capturedAt),
    description: request.description,
    status: 'pending_synchronisation',
    notes: [QUEUED_NOTICE],
    possibleDuplicate: false,
  };
}
