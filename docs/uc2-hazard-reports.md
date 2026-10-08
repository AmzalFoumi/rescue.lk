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

| Method | Path          | What it does                                                       | Errors   |
| ------ | ------------- | ------------------------------------------------------------------ | -------- |
| POST   | `/`           | Submit a report. Stored as Pending Verification. Flags duplicates. | 400      |
| POST   | `/offline`    | No network: put the report in the offline queue.                   | 400      |
| POST   | `/sync`       | Back online: store every queued report. Failed ones stay queued.   |          |
| GET    | `/`           | List reports that are Pending Verification.                        |          |
| GET    | `/:id`        | One report: details, photo, location, duplicates, status.          | 404      |
| PATCH  | `/:id/verify` | Operator verifies. Body: `operatorId`.                             | 404, 409 |
| PATCH  | `/:id/reject` | Operator rejects. Body: `operatorId`, `reason` (required).         | 404, 409 |

400 means a field is missing or invalid (the response names the field).

## Diagram message → code

| Diagram message                                          | Code                                                                    |
| -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `enterReportDetails`, `attachPhoto`, location            | `SubmitHazardReportDto` (photo is a URL string)                         |
| `validateReport(data)`                                   | `ValidationPipe` + decorators on the DTO                                |
| `checkDuplicate(report)`                                 | `DuplicateChecker.findDuplicateIds`                                     |
| `getStatus()` / `submissionSuccess(status)`              | the returned report has `status`                                        |
| `queueOffline()` / `enqueue(report)`                     | `HazardReportsService.queueOffline` → `OfflineReportQueue.enqueue`      |
| `syncWhenOnline()`                                       | `HazardReportsService.syncQueued` → `OfflineReportQueue.syncWhenOnline` |
| `getPendingReports()`                                    | `HazardReportsService.listPending`                                      |
| `selectReport(reportId)`                                 | `HazardReportsService.getById`                                          |
| `verifyReport(reportId)` / `setStatus(Verified)`         | `HazardReportsService.verify`                                           |
| `rejectReport(reportId, reason)` / `setStatus(Rejected)` | `HazardReportsService.reject`                                           |

## Design choices

- **Repository pattern.** The service talks to a `HazardReportsRepository` interface.
  Only `mongoose-hazard-reports.repository.ts` touches MongoDB. Tests use a fake repository.
- **Dependency injection.** NestJS gives the service its repository and queue.
- **Small status state machine.** `canChangeStatus` in `hazard-report-status.ts`.
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
`setStatus` step. `status` and `hazardType` are enums, stored as strings.

## Run the tests

```
npm run test --workspace=apps/api
npm run test:cov --workspace=apps/api
```
