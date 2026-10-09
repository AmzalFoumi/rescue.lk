import mongoose, { Types } from 'mongoose';
import { HazardReportStatus } from '../modules/hazard-reports/hazard-report-status.js';
import { HazardType } from '../modules/hazard-reports/hazard-type.js';
import { ReporterRole } from '../modules/hazard-reports/reporter-role.js';
import {
  HazardReport,
  HazardReportSchema,
} from '../modules/hazard-reports/schemas/hazard-report.schema.js';

/**
 * Demo hazard reports, so the warnings screen has verified reports to pick from
 * and one that is still pending (to show the "report is not verified" error).
 * Each report has a fixed seed reporter id, so running the seed again updates
 * the same reports instead of adding copies.
 */

const VERIFIER = 'operator-kj';
const HOUR_MS = 60 * 60 * 1000;

interface SeedReport {
  reporterId: string;
  reporterName: string;
  hazardType: HazardType;
  district: string;
  placeName: string;
  description: string;
  latitude: number;
  longitude: number;
  status: HazardReportStatus;
  hoursAgo: number;
}

const REPORTS: SeedReport[] = [
  {
    reporterId: 'seed-citizen-1',
    reporterName: 'Nimal Perera',
    hazardType: HazardType.Flood,
    district: 'Ratnapura',
    placeName: 'Ratnapura town',
    description: 'Kalu Ganga is over the bank and water is entering shops.',
    latitude: 6.6828,
    longitude: 80.3992,
    status: HazardReportStatus.Verified,
    hoursAgo: 6,
  },
  {
    reporterId: 'seed-citizen-2',
    reporterName: 'Kamala Silva',
    hazardType: HazardType.Landslide,
    district: 'Nuwara Eliya',
    placeName: 'Ramboda',
    description: 'Part of the hillside slipped and covers half of the road.',
    latitude: 7.0,
    longitude: 80.7,
    status: HazardReportStatus.Verified,
    hoursAgo: 5,
  },
  {
    reporterId: 'seed-citizen-3',
    reporterName: 'Ruwan Silva',
    hazardType: HazardType.RoadBlockage,
    district: 'Kandy',
    placeName: 'Peradeniya',
    description: 'Fallen trees block the Colombo-Kandy road near the junction.',
    latitude: 7.2602,
    longitude: 80.597,
    status: HazardReportStatus.Verified,
    hoursAgo: 4,
  },
  {
    reporterId: 'seed-citizen-4',
    reporterName: 'Fathima Rizvi',
    hazardType: HazardType.Flood,
    district: 'Galle',
    placeName: 'Baddegama',
    description: 'Gin Ganga is rising fast; low-lying houses are cut off.',
    latitude: 6.1667,
    longitude: 80.1833,
    status: HazardReportStatus.Verified,
    hoursAgo: 3,
  },
  {
    reporterId: 'seed-citizen-5',
    reporterName: 'Anura Jayasinghe',
    hazardType: HazardType.Fire,
    district: 'Anuradhapura',
    placeName: 'Mihintale',
    description: 'Grass fire near the reservoir bund, spreading with the wind.',
    latitude: 8.35,
    longitude: 80.5,
    status: HazardReportStatus.PendingVerification,
    hoursAgo: 1,
  },
];

export async function seedHazardReports(
  districtIds: Map<string, Types.ObjectId>,
): Promise<void> {
  const HazardReportModel = mongoose.model(
    HazardReport.name,
    HazardReportSchema,
  );
  const now = Date.now();
  let seeded = 0;

  for (const report of REPORTS) {
    const district = districtIds.get(report.district);
    if (!district) {
      console.warn(
        `Skipped report "${report.reporterId}": district ${report.district} not found.`,
      );
      continue;
    }
    const capturedAt = new Date(now - report.hoursAgo * HOUR_MS);
    const verified = report.status === HazardReportStatus.Verified;
    await HazardReportModel.updateOne(
      { reporterId: report.reporterId },
      {
        $set: {
          hazardType: report.hazardType,
          description: report.description,
          placeName: report.placeName,
          reporterName: report.reporterName,
          reporterRole: ReporterRole.Citizen,
          location: { latitude: report.latitude, longitude: report.longitude },
          district,
          capturedAt,
          status: report.status,
          ...(verified
            ? {
                verifiedBy: VERIFIER,
                verifiedAt: new Date(capturedAt.getTime() + HOUR_MS / 2),
              }
            : {}),
        },
      },
      { upsert: true },
    );
    seeded += 1;
  }

  console.log(`Seeded ${seeded} hazard reports.`);
}
