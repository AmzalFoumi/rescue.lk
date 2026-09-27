# rescue.lk — Smart Disaster Early-Warning & Emergency Coordination System

Group_038 — SLIIT SE3070 (CSSE) Assignment 02. A monorepo scaffold for Sri Lanka's DMC
disaster warning and emergency coordination platform. Each member owns one use-case
module; this repo only provides the shared scaffold — business logic is implemented per
module by its owner.

## Use case ownership

| UC  | Module           | Description                               | Owner           |
| --- | ---------------- | ----------------------------------------- | --------------- |
| UC1 | `warnings`       | Manage & Issue Disaster Warnings          | _(assign name)_ |
| UC2 | `hazard-reports` | Submit & Verify Hazard Reports            | _(assign name)_ |
| UC3 | `response`       | Coordinate Emergency Response & Resources | _(assign name)_ |
| UC4 | `analytics`      | Analyse Disaster & Generate Reports       | _(assign name)_ |

See [`.github/CODEOWNERS`](.github/CODEOWNERS) — update the `@uc*-owner` placeholders
with real GitHub usernames once roles are assigned.

## Stack

- **Package manager**: npm workspaces (monorepo)
- **Frontend**: Next.js 16 (App Router, TypeScript, Tailwind) — `apps/web`
- **Backend**: NestJS 12 (TypeScript, strict mode) — `apps/api`
- **Database**: MongoDB Atlas (free/M0 tier) via Mongoose — no local DB container needed
- **Shared types**: `packages/shared` — DTO interfaces/enums used by both apps
- **Testing**: Vitest (both apps; Nest 12 and this scaffold's web setup both default to
  Vitest over Jest) + React Testing Library for `apps/web`
- **Linting**: oxlint (`apps/api`, Nest's current default) + ESLint (`apps/web`, Next's
  current default), formatted consistently with a shared root Prettier config

## Prerequisites

- Node.js matching [`.nvmrc`](.nvmrc) (currently `20`; if using `nvm`, run `nvm use`)
- npm (ships with Node)
- A free [MongoDB Atlas](https://www.mongodb.com/atlas) account — no Docker/local Mongo
  required. Create an M0 (free tier) cluster, a database user, and allow your IP, then
  copy the `mongodb+srv://...` connection string from **Database > Connect > Drivers**.

## Setup

```bash
git clone <this-repo>
cd rescue.lk
npm install

# Backend env
cp apps/api/.env.example apps/api/.env
# then edit apps/api/.env and paste your real MONGODB_URI (from Atlas)

# Frontend env
cp apps/web/.env.example apps/web/.env.local

# Seed reference data (Sri Lankan districts) into your Atlas cluster
npm run db:seed
```

## Scripts (run from repo root)

| Script             | What it does                                               |
| ------------------ | ---------------------------------------------------------- |
| `npm run dev`      | Runs both `apps/api` and `apps/web` in parallel (dev mode) |
| `npm run lint`     | Lints both apps (oxlint for api, ESLint for web)           |
| `npm run test`     | Runs unit tests for both apps                              |
| `npm run test:cov` | Runs tests with coverage (api enforces an 80% threshold)   |
| `npm run build`    | Builds both apps                                           |
| `npm run db:seed`  | Seeds dummy Sri Lankan districts into your `MONGODB_URI`   |

Per-app-only scripts (`typecheck`) run via `npm run typecheck --workspace=apps/api` (or
`apps/web`).

Once running, the API is at `http://localhost:3000/api`, with Swagger docs at
`http://localhost:3000/api/docs`. The web app is at `http://localhost:3001` (or whatever
port `next dev` picks — check the terminal output).

## Branching strategy

- `main` is protected — no direct pushes.
- Work happens on `feature/uc<N>-<short-description>` branches (e.g.
  `feature/uc1-issue-warning-form`).
- Open a PR into `main` using the provided
  [PR template](.github/pull_request_template.md); at least **one review** is required
  before merging.
- CODEOWNERS auto-requests the relevant use-case owner as a reviewer for changes under
  their module.

## Commit conventions

This repo uses [Conventional Commits](https://www.conventionalcommits.org/), enforced by
commitlint via a [Lefthook](https://lefthook.dev) `commit-msg` hook:

```
<type>(<optional scope>): <short summary>

feat(warnings): add warning issuance form
fix(api): correct district reference in hazard report schema
chore: bump dependency versions
docs: update setup instructions
```

Common types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `ci`. A Lefthook
pre-commit hook also runs Prettier and the relevant linter on staged files before each
commit — it's installed automatically the moment you run `npm install` (no extra setup
step), see [`lefthook.yml`](lefthook.yml).

## Repo layout

```
apps/
  web/                 Next.js frontend
    src/app/{warnings,hazard-reports,response,analytics}/   route placeholders
    src/features/{...}/                                     per-UC components (add here)
    src/lib/api.ts                                           typed API client
  api/                 NestJS backend
    src/modules/{warnings,hazard-reports,response,analytics}/
      *.module.ts, *.controller.ts, *.service.ts
      *.repository.interface.ts + mongoose-*.repository.ts   (DI-token pattern — swap
                                                                the Mongoose impl for a
                                                                mock in unit tests)
      dto/, schemas/
packages/
  shared/              DTO interfaces & enums shared by both apps
docs/                  diagrams, report assets, screenshots
.github/               CI workflow, CODEOWNERS, PR template
```

## Notes for module owners

- Each module already has one placeholder `GET /api/<module>/health` endpoint, a
  DI-token repository interface + Mongoose implementation, and one passing sample spec
  — extend these rather than restructuring them.
- `analytics` has no dedicated schema yet since it reads/aggregates across the other
  modules — design its read model as part of UC4's implementation.
- Coverage threshold (80%, lines/branches/functions/statements) is enforced for
  `apps/api` in CI; `main.ts`, `*.module.ts`, `dto/`, `schemas/`, repository
  implementations, and other framework boilerplate are excluded — see
  `apps/api/vitest.config.ts`.
