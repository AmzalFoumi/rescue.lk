# UC2 — Submit & Verify Hazard Reports (backend)

Owner: Amzal M F M ([@AmzalFoumi](https://github.com/AmzalFoumi)).
Code: `apps/api/src/modules/hazard-reports/`.

This covers the two sequence diagrams "Submit Hazard Report" and "Verify Hazard Report".
The screens (UI) and GPS capture are not part of the backend. The client sends the
position as numbers.

## Status of a report

```
Pending Synchronisation   (waiting in the offline queue, not stored yet)
Pending Verification  ──verify──▶  Verified
                      └─reject──▶  Rejected
```

A report can leave "Pending Verification" only once. A second verify or reject returns
**409 Conflict**.

## Endpoints

Base path: `/api/hazard-reports`. Try them in Swagger at `/api/docs`.

| Method | Path          | What it does                                                       | Errors        |
| ------ | ------------- | ------------------------------------------------------------------ | ------------- |
| POST   | `/`           | Submit a report. Stored as Pending Verification. Flags duplicates. | 400           |
| POST   | `/offline`    | No network: put the report in the offline queue.                   | 400           |
| POST   | `/sync`       | Back online: store every queued report. Failed ones stay queued.   |               |
| GET    | `/`           | List reports that are Pending Verification.                        |               |
| GET    | `/:id`        | One report: details, photo, location, duplicates, status.          | 404           |
| PATCH  | `/:id/verify` | Operator verifies. Body: `operatorId`.                             | 400, 404, 409 |
| PATCH  | `/:id/reject` | Operator rejects. Body: `operatorId`, `reason` (required).         | 400, 404, 409 |

400 means a field is missing or invalid (the response names the field). 404 also covers an
id that is not a valid report id.

A report has `id`, `hazardType`, `description`, `photoUrl`, `location` (`latitude`,
`longitude`), `district`, `capturedAt`, `submittedAt`, `status`, `possibleDuplicateOf`,
`reporterId`, `reporterRole`, and after a decision `verifiedBy`, `verifiedAt` and
`rejectionReason`.

## Diagram message → code

The Submit diagram is one service and the Verify diagram is the other.

| Diagram message                                          | Code                                                                             |
| -------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `enterReportDetails`, `attachPhoto`, `captureLocation`   | `SubmitHazardReportDto` (photo is a URL string, `location` is nested)            |
| `validateReport(data)`                                   | `ValidationPipe` + decorators on the DTO                                         |
| `checkDuplicate(report)`                                 | `DuplicateChecker.findDuplicateIds`                                              |
| `getStatus()` / `submissionSuccess(status)`              | the returned report has `status`                                                 |
| `queueOffline()` / `enqueue(report)`                     | `HazardReportSubmissionService.queueOffline` → `OfflineReportQueue.enqueue`      |
| `syncWhenOnline()`                                       | `HazardReportSubmissionService.syncQueued` → `OfflineReportQueue.syncWhenOnline` |
| `getPendingReports()`                                    | `HazardReportVerificationService.listPending`                                    |
| `selectReport(reportId)`                                 | `HazardReportVerificationService.getById`                                        |
| `verifyReport(reportId)` / `setStatus(Verified)`         | `HazardReportVerificationService.verify`                                         |
| `rejectReport(reportId, reason)` / `setStatus(Rejected)` | `HazardReportVerificationService.reject`                                         |

## Design patterns

- **Repository pattern.** The services talk to a `HazardReportsRepository` interface.
  Only `mongoose-hazard-reports.repository.ts` touches MongoDB. Tests use a fake repository.
- **Dependency injection.** NestJS gives each service its repository, queue and duplicate
  checker. Nothing creates its own dependencies with `new`.
- **Small status state machine.** `canChangeStatus` in `hazard-report-status.ts`.

## SOLID, where to see it

- **S, one reason to change.** `HazardReportSubmissionService` changes only for submit
  rules. `HazardReportVerificationService` changes only for verify rules. The duplicate
  rule, the status rules and the offline queue each have their own small file.
- **O, extend without editing.** A new status move is one line in the status table. A new
  hazard type is one enum value.
- **L, replaceable parts.** `InMemoryOfflineReportQueue` and the Mongoose repository can be
  swapped for any class that follows the same interface. The tests use fakes.
- **I, small interfaces.** The queue has 3 methods and the repository has 5. Nothing is
  forced to implement a method it does not use.
- **D, depend on abstractions.** Services depend on the interfaces
  (`HazardReportsRepository`, `OfflineReportQueue`) and on plain types
  (`HazardReportRecord`, `ReportSubmission`). The interfaces do not mention Mongoose or the
  web layer.

## Code smells we fixed

- A swallowed error in the offline sync is now logged with the reason.
- `DuplicateChecker` is injected, not created inside the service.
- The 24-hour window is calculated in one place (`DuplicateChecker.searchWindow`).
- `latitude` and `longitude` travel together as one `Location`.
- Magic numbers have names (`MAX_DESCRIPTION_LENGTH`, `MAX_REASON_LENGTH`, `MS_PER_HOUR`).
- One big service became two small ones (Divergent Change).

## Design choices

- **Duplicate check.** Same hazard type, within 500 m, captured within 24 h. The two limits
  are constants in `duplicate-checker.ts`. A duplicate is flagged in `possibleDuplicateOf`,
  never rejected.
- **Offline queue is a mock.** It lives in memory (lost on restart). The real queue would
  be on the reporter's phone.

## Left out on purpose

Login and identity checks (`operatorId` and `reporterId` are plain fields), real photo
upload, triage, a configurable HazardType list (a fixed enum is used), and saving the
offline queue.

## Differences from the class diagram

The sequence diagram wins where they disagree. Added fields not in the class diagram:
`photoUrl`, `possibleDuplicateOf`, `verifiedBy`, `verifiedAt`, `rejectionReason`, and the
`setStatus` step. `status` and `hazardType` are enums, stored as strings. `submittedAt` is
the time the server stored the report.

## Run the tests

```
npm run test --workspace=apps/api
npm run test:cov --workspace=apps/api
```
