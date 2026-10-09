# UC2 — Submit & Verify Hazard Reports (web app)

Owner: Amzal M F M ([@AmzalFoumi](https://github.com/AmzalFoumi)).
Code: `apps/web/src/features/hazard-reports/` (the screens) and `apps/web/src/app/hazard-reports/` (the routes).
The API behind it is described in [`uc2-hazard-reports.md`](uc2-hazard-reports.md).

The design is Lakindu's mobile mock-up. We build it as a normal responsive web page: a phone-width column for
the citizen, and a two-pane page for the DMC operator that stacks on a phone. There is no login (it is not
graded), so the app acts as one demo citizen (Nimal Perera) and one demo operator (K. Jayawardena).

## Run it

```
npm run db:seed --workspace=apps/api     # once: fills the 15 districts in Atlas
npm run dev                              # API on 3000, web on 3001
```

The web app must run on port **3001** because the API only allows that origin (CORS). If port 3000 is busy,
start the API with `PORT=3200` and put `NEXT_PUBLIC_API_URL=http://localhost:3200/api` in `apps/web/.env.local`.

| Page                     | Who      | What                                 |
| ------------------------ | -------- | ------------------------------------ |
| `/hazard-reports`        | Citizen  | Home                                 |
| `/hazard-reports/new`    | Citizen  | The 4-step report form               |
| `/hazard-reports/mine`   | Citizen  | My Reports (status tracking)         |
| `/hazard-reports/verify` | Operator | Pending list, review, verify, reject |

The strip at the top has a **Network** switch. Turn it off to try offline reporting: reports are saved
(the API's mock `OfflineReportQueue`) and sent again when the switch is turned back on. This replaces the
design's "Dev tools" bar.

## How the code is organised

Each layer only knows the layer below it. Nothing outside `api/` calls `fetch`.

```
app/hazard-reports/*   thin route files: pick a screen, no logic
screens/               containers: connect hooks to components (CitizenHome, NewReportScreen, ...)
components/            presentational: props in, events out (StatusChip, ReviewStep, DecisionPanel, ...)
hooks/                 state and effects (useReportWizard, useOfflineQueue, useAsyncData, ...)
state/                 ReportingProvider: demo identities, network switch, offline queue
api/                   HazardReportsApi / DistrictsApi interfaces + the fetch-based clients
domain/                pure functions and constants (validation, building the request, labels, formatting)
```

## SOLID, where to see it

- **S, one reason to change.** Validation rules live in `domain/report-draft.ts`, not in components. The wizard
  state is a pure reducer (`hooks/report-wizard-reducer.ts`). A card is a view of a `ReportCardModel`
  (`domain/report-card.ts`), so `ReportCard.tsx` only draws.
- **O, extend without editing.** Hazard types, status looks, reject reasons and review rows are data tables
  (`HAZARD_TYPE_OPTIONS`, `STATUS_PRESENTATION`, `REJECT_REASONS`). A new row needs no logic change.
- **L, replaceable parts.** Any object with the `HazardReportsApi` shape works in place of the real client.
  The tests use fakes (`testing/test-support.tsx`).
- **I, small interfaces.** Components take only the props they use. `DistrictsApi` has one method.
- **D, depend on abstractions.** Hooks get the API from `useHazardReportsApi()` (a React context), never from
  `fetch`. Only `api/` and `lib/api.ts` know about HTTP.

## Code smells we watched for

- No empty `catch`: errors become messages (`ApiError`, `errorMessage`) and are shown to the user.
- No magic numbers: `MIN_DESCRIPTION_LENGTH`, `MAX_REJECTION_LENGTH`, `TOTAL_STEPS`, `GEOLOCATION_TIMEOUT_MS`.
- No duplicate code: one `StatusChip`, one `ReportCard` for queued and saved reports, one `useAsyncData`
  and `useAsyncAction` for every loading and button state, shared test wrapper.
- Small files: every component is under about 100 lines. Long conditions became named functions.
- Two things fixed while building, found by the tests: a domain file importing from the hooks layer (moved
  `SyncState` into `domain/`), and `useAsyncData` showing old data for a moment when its loader changed.

## Design to code

| Design screen / state                         | Where                                                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Home (greeting, tiles)                        | `screens/CitizenHome.tsx`, `components/HomeTile.tsx`                                                   |
| Step 1: hazard type, "Other" text             | `components/HazardTypeStep.tsx`                                                                        |
| Step 2: GPS, manual location, description     | `DetailsStep.tsx`, `LocationPicker.tsx`, `GpsPanel.tsx`, `ManualLocationPanel.tsx`                     |
| Validation ("Fix N items to continue")        | `domain/report-draft.ts`, `components/ErrorSummary.tsx`                                                |
| Step 3: photo                                 | `components/PhotoStep.tsx`                                                                             |
| Step 4: review with Edit links                | `domain/review-rows.ts`, `components/ReviewStep.tsx`                                                   |
| Result: sent / saved on this phone            | `components/SubmitResult.tsx`                                                                          |
| Offline banner, sending, sent, could not send | `domain/connection-notice.ts`, `components/ConnectionBanner.tsx`                                       |
| My Reports                                    | `screens/MyReportsScreen.tsx`, `components/ReportCard.tsx`                                             |
| Operator list, review, duplicates, decision   | `screens/OperatorVerifyScreen.tsx`, `PendingList`, `ReportDetails`, `DuplicatesPanel`, `DecisionPanel` |
| Verified / rejected toast                     | `domain/decision-message.ts`, `components/Toast.tsx`                                                   |

## Scenarios

| Scenario                             | How the app shows it                                                      |
| ------------------------------------ | ------------------------------------------------------------------------- |
| UC-002A main flow (steps 3 to 10)    | The 4-step form, then the result screen with the status                   |
| 5.a location by hand                 | "Enter location manually instead": district + landmark                    |
| 7.a missing or wrong fields          | Error summary and a message under each field; the API's 400 messages too  |
| 8.a possible duplicate               | Notice on the result screen and on the card; the operator sees the report |
| 9.a no network                       | Network switch off: "Save report on this phone", Pending Synchronisation  |
| 9.b a saved report could not be sent | Banner "N reports could not be sent. They stay saved...", Try again       |
| UC-002B steps 1 to 6                 | Pending list, review, verify; the citizen sees the result in My Reports   |
| 4.a reject with a reason             | A reason is required; the citizen sees "Reason: ..." on the card          |

## Differences from the design (on purpose)

- Not built: language switch, Large text, the 4-stage tracker, "Decided this session" list, duplicate distance
  (would copy the haversine code into the web app), Warnings and Safety information tiles beyond a link.
- The photo is a mock: the file stays on the device and a made-up URL is sent (the API has no upload).
- A manual location sends the centre of the chosen district as coordinates; the landmark becomes `placeName`.
- GPS reports are filed under the citizen's home district (Ratnapura).
- The API flags only the newer report as a possible duplicate; the design flags both ways.
- Added (the design has none): loading, error and empty states, the "could not be sent" state (9.b), a back
  button on the operator page for phones.

## Waiting for UC1 (Warnings)

The Home screen links to `/warnings`, the page of use case 1 (owner: Rimasha). Today that page is a placeholder.
When her API and screens are merged, **recheck these points**:

1. `WARNINGS_HREF` in `features/hazard-reports/routes.ts` still points at her page, and the Warnings tile text
   in `screens/CitizenHome.tsx` still makes sense.
2. The design also shows an **Active warning card** on Home and "N active in Ratnapura" on the tile. That is
   not built because it needs her API. The hook-in point is `CitizenHome`: add a small hook that calls her
   list endpoint (`api.warnings.list()` already exists in `src/lib/api.ts`) and shows the card and the count.
   Check her endpoint path, filters (by district) and the `WarningDto` in `packages/shared`.
3. The design's bottom bar has a **Warnings tab**. Ours has Home, Report, My Reports. Add the tab if the group
   wants it (`components/BottomNav.tsx`, one row in `NAV_ITEMS`).
4. Her PR may change shared files (`packages/shared`, `lib/api.ts`, `layout.tsx`): resolve any merge conflicts
   with ours, then run the checks below.

## Tests

```
npm run test:cov --workspace=apps/web
```

255 tests (unit, hook and screen tests with Vitest and Testing Library). Coverage is above 98% for statements.
`vitest.config.mts` holds `src/features/hazard-reports` to 80%. The tests cover good paths, wrong input, edge
values (9 and 10 characters, exact limits), and errors (network down, 400, 404, 409, a failed sync).
