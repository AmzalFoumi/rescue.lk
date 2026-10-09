# UC1 – Manage & Issue Disaster Warnings: implementation plan

Owner: Rimasha M. R. F. (IT23602496) · Repo: rescue.lk (NestJS 12 API + Next.js 16 web + MongoDB Atlas, Vitest)
Deadline: 9 Oct 2026, 11:59 PM. Marks: implementation accuracy 30, code quality 20, unit tests 20.

## 0. Ground rules (from AGENTS.md, README, lectures 3 and 4)

- Branch `feature/uc1-issue-warning`, PR into `main`, Conventional Commits (`feat(warnings): ...`). No AI trailer in commits.
- API imports need the `.js` suffix. npm only. No Docker DB. `packages/shared` is types-only (no real enums).
- Services never inject the Mongoose Model. They use the repository interface via its DI token.
- Only touch the `warnings` module (and the UC1 web feature). Do not implement UC2/3/4 logic.
- Coverage target 80% lines/branches/functions/statements (already enforced in CI).
- Lecture rules to follow: SRP, OCP, LSP, ISP, DIP; no magic numbers (config/constants); log with levels and context; never swallow exceptions; avoid long methods, long parameter lists (use parameter objects), switch/if-else chains (use polymorphism), god classes, duplicate code, primitive obsession.

## 1. Mapping: sequence diagram -> code

| Diagram lifeline / message            | Code                                                                                                                          |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Assessment Officer                    | user of the web UI (no login: excluded by the brief)                                                                          |
| :WarningManagementUI                  | `apps/web/src/features/warnings/*` + `app/warnings/page.tsx`                                                                  |
| :WarningController                    | `warnings.controller.ts` (REST + DTO validation)                                                                              |
| :HazardReport (getStatus, ref Verify) | `HazardReportLookup` port (interface) in warnings; `MongooseHazardReportLookup` reads UC2's verified reports                  |
| validateWarning (8.2)                 | `WarningValidator` (business rules) + class-validator DTO                                                                     |
| :Warning «create»                     | `Warning` schema/entity + `WarningsService.issueWarning()`                                                                    |
| deliver() + par                       | `WarningDeliveryService.deliver()` using `Promise.allSettled` over selected channels                                          |
| push/sms/audible:AlertChannel         | `AlertChannel` interface + `PushChannel`, `SmsChannel`, `AudibleChannel` (mock gateways), injected as a list via one DI token |
| loop(0,3) [send failed]               | `RetryPolicy` (max attempts from config, not a magic number)                                                                  |
| :DeliveryRecord (recordDelivery)      | `DeliveryRecord` schema + `deliveries.repository`                                                                             |
| 10.2 / 11 deliveryStatus              | `GET /warnings/:id/deliveries` returns per-channel status                                                                     |
| alt [invalid] -> validationError      | domain exceptions (`ReportNotVerifiedException`, `InvalidWarningException`) -> 4xx via existing exception filter              |

## 2. Design patterns to name in the viva

- Strategy: `AlertChannel` implementations (OCP: add email by adding a class, no edits).
- Repository + Dependency Inversion: services depend on interfaces, Mongoose only in `mongoose-*.repository.ts`.
- Factory/Registry: `ChannelRegistry` resolves selected channel names to implementations.
- Parameter Object: `IssueWarningCommand` instead of 6 loose arguments.
- Ports and adapters: `HazardReportLookup` keeps UC1 independent from UC2.

## 3. Work order (time-boxed)

| Phase | What                                                                                   | Output                    | Time   |
| ----- | -------------------------------------------------------------------------------------- | ------------------------- | ------ |
| 0     | Branch, `npm install`, `.env` (Atlas URI), run baseline `npm test` and `npm run dev`   | green baseline            | 30 min |
| 1     | Shared types + DTOs + schemas (Warning, DeliveryRecord, TargetArea as district ids)    | types compile             | 45 min |
| 2     | Backend core, test-first: validator, channels, retry, parallel delivery, issueWarning  | unit tests green          | 2-3 h  |
| 3     | Controller + endpoints + Swagger + exception mapping + small e2e                       | API works in Swagger      | 1 h    |
| 4     | Simple frontend (see section 4)                                                        | working UI                | 2 h    |
| 5     | Extra scenarios from the report: cancel, extend, escalate (status transitions, small)  | tests for each            | 1-2 h  |
| 6     | Quality pass: smell checklist, `npm run lint`, `npm run test:cov`, coverage screenshot | report section 5.5 inputs | 1 h    |
| 7     | Viva notes: file-by-file "which principle/smell/pattern" cheat sheet                   | docs/uc1-viva-notes.md    | 30 min |

Cut line if time runs out: phases 0-4 and 6 are the must-haves. Phase 5 is the first thing to trim.

## 4. Simple frontend now, redesign later

Keep UI thin so a new design only changes presentation:

- One page `app/warnings/page.tsx` renders `features/warnings/IssueWarningFlow`.
- Steps match the sequence: 1) pick a verified report, 2) enter details (title, message, severity, target districts), 3) choose channels (push / SMS / audible), 4) confirmation summary, 5) delivery status table per channel (sent / failed / attempts).
- All data access through `lib/api.ts` (`api.warnings.*`); no fetch calls inside components.
- Presentational components take props only (`ReportPicker`, `WarningForm`, `ChannelSelector`, `ConfirmationSummary`, `DeliveryStatusTable`). When the frontend developer's design is ready, swap markup/styles, keep hooks and API calls.
- Colour is never the only status signal (text + icon), per the report's accessibility critique.

## 5. How to prompt (copy and adapt)

Pattern: Task, Context, Rules, Done when.

Start of every session:
"Read AGENTS.md, docs/setup-notes.md and docs/uc1-implementation-plan.md. I own UC1 (warnings module). Follow lectures 3 and 4 rules (SOLID, no code smells, no magic numbers, logging, no swallowed exceptions)."

Per phase examples:

- "Phase 2: write failing Vitest tests first, then implement WarningValidator. Rules: ...; done when tests pass and coverage for that file is above 90%."
- "Review my warnings module against the smells list in lecture 4 and refactor only what is a real smell. Explain each change in one line so I can say it in the viva."
- "Explain WarningDeliveryService line by line as if I am being asked in a viva: which SOLID principle, which pattern, why."

## 6. Open items

- UC1 reads UC2's reports through `MongooseHazardReportLookup`, which reads the hazard report and district schemas only (no UC2 services). Hazard types use the one shared lowercase `HazardType`.
- Report section 5.5 needs screenshots, test count and coverage percent. Collect after phase 6.
- Appendix A of the report needs every AI prompt listed: keep a log as you go.
- Working tree shows every file as modified because of line endings (CRLF). Stage only your own files; never `git add .`.
