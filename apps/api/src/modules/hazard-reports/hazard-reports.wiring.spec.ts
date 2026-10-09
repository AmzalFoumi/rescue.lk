import { Test } from '@nestjs/testing';
import { describe, it, expect } from 'vitest';
import { DuplicateChecker } from './duplicate-checker.js';
import { HazardReportSubmissionService } from './hazard-report-submission.service.js';
import { HazardReportTrackingService } from './hazard-report-tracking.service.js';
import { HazardReportVerificationService } from './hazard-report-verification.service.js';
import { fakeRepository } from './hazard-report.test-data.js';
import { HazardReportsController } from './hazard-reports.controller.js';
import { HAZARD_REPORTS_REPOSITORY } from './hazard-reports.repository.interface.js';
import {
  InMemoryOfflineReportQueue,
  OFFLINE_REPORT_QUEUE,
} from './offline-report-queue.js';

// Builds the module with the same providers as HazardReportsModule, but with a
// fake repository. A missing provider would fail here, not only at startup.
describe('HazardReports wiring', () => {
  it('creates the controller and both services', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HazardReportsController],
      providers: [
        HazardReportSubmissionService,
        HazardReportVerificationService,
        HazardReportTrackingService,
        DuplicateChecker,
        { provide: HAZARD_REPORTS_REPOSITORY, useValue: fakeRepository() },
        { provide: OFFLINE_REPORT_QUEUE, useClass: InMemoryOfflineReportQueue },
      ],
    }).compile();

    expect(moduleRef.get(HazardReportsController)).toBeDefined();
    expect(moduleRef.get(HazardReportSubmissionService)).toBeDefined();
    expect(moduleRef.get(HazardReportVerificationService)).toBeDefined();
    expect(moduleRef.get(HazardReportTrackingService)).toBeDefined();
  });
});
