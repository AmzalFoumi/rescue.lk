# Setup notes — read this before you start editing

This scaffold deviates from what most tutorials/AI training data assume, in several
non-obvious ways. If something looks "wrong" compared to a guide you're following,
check here first.

## Package manager: npm, not pnpm

Root `package.json` uses `"workspaces"` (npm workspaces). Always run `npm install` /
`npm run <script> --workspace=apps/api` (etc.), never `pnpm`.

## Database: MongoDB Atlas, not Postgres, not a local container

- No Docker/`docker-compose.yml` for the DB. There is no local Mongo to spin up.
- Create your own free-tier (M0) cluster at https://www.mongodb.com/atlas, get its
  `mongodb+srv://...` connection string, and put it in `apps/api/.env` as `MONGODB_URI`
  (copy from `apps/api/.env.example`).
- Uses `@nestjs/mongoose` (Mongoose), not Prisma.

## apps/api is ESM — imports need `.js` extensions

NestJS 12 scaffolds with `"type": "module"` and `moduleResolution: "nodenext"`. Every
relative import must end in `.js`, even though the source file is `.ts`:

```ts
// correct
import { WarningsService } from './warnings.service.js';
// wrong — build fails
import { WarningsService } from './warnings.service';
```

## apps/api uses Vitest + oxlint, not Jest + ESLint

This is Nest 12's own current default (the CLI generator changed after most
tutorials/training data were written) — not a customization. `apps/web` still uses
ESLint (Next.js's default), so the two apps intentionally use different linters. Prettier
formatting is shared across both via the root `.prettierrc`.

## packages/shared is types-only — no build step

`main`/`types`/`exports` in `packages/shared/package.json` all point straight at
`src/index.ts`. There is no `dist/`, no compile step. This only works because the
package currently exports types/interfaces only (erased at compile time by consumers).

**Do not add runtime code** (real `enum`, functions, constants with values) to this
package without first adding a build step — otherwise apps/api's `nodenext` module
resolution and any bundler consuming the package at runtime will not find compiled JS.

## Coverage: `app.controller.ts` / `app.service.ts` are excluded on purpose

The Nest-generated "Hello World" boilerplate at `apps/api/src/app.controller.ts` and
`app.service.ts` trips a TypeScript decorator-metadata compiler artifact
(`typeof Reflect === "object"` in the emitted `__metadata` helper) that always shows as
a 50%-covered branch, no matter what tests you write against it — it's unrelated to
real logic. They're excluded in `apps/api/vitest.config.ts`'s `coverage.exclude` for
that specific reason. Don't try to "fix" the coverage number by writing a test for it.

The real 80% threshold (lines/branches/functions/statements) applies to
services/controllers; `*.module.ts`, `dto/`, `schemas/`, `main.ts`, repository
implementations (`mongoose-*.repository.ts`), `common/filters/`, `config/`, and
`database/` are also excluded — see that same file for the full, current list.

## Vitest configs are `.mts`, not `.ts`

`apps/web/vitest.config.mts` (not `.ts`) — avoids a CJS/ESM parsing warning from Vite's
native config loader, since `apps/web/package.json` doesn't set `"type": "module"`.

## Git hooks: Lefthook, not Husky

Pre-commit/commit-msg hooks are managed by [Lefthook](https://lefthook.dev)
(`lefthook.yml` at repo root), not Husky — the assignment brief never actually
mandated a specific git-hook tool, Husky was just the first scaffold's default and got
swapped out. `npm install -D lefthook`'s own `postinstall` script runs
`lefthook install` automatically, so **anyone who clones and runs a plain
`npm install` gets the hooks active with zero extra steps** (no `npm run prepare`
needed, unlike Husky). If hooks ever seem inactive after a fresh clone, run
`npx lefthook install` manually and check `git config core.hooksPath` isn't pointing
somewhere stale (e.g. a leftover `.husky/_` from before this switch).

## Repository pattern (all 4 API modules)

Each module (`warnings`, `hazard-reports`, `response`, `analytics`) follows: service →
depends on a `*RepositoryInterface` (injected via a DI token, e.g. `WARNINGS_REPOSITORY`)
→ implemented by `mongoose-*.repository.ts` (the only place that touches the Mongoose
`Model` directly). This exists so services can be unit-tested with a mocked repository —
**never inject the Mongoose `Model` directly into a service.**

## Scaffold scope

This repo is a **scaffold only** — no business logic. Four use-case modules exist as
skeletons (module/controller/service/repository/health endpoint/one sample test each),
one per team member:

| Module           | Use case                                                                                                                                |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `warnings`       | UC1 — Manage & Issue Disaster Warnings                                                                                                  |
| `hazard-reports` | UC2 — Submit & Verify Hazard Reports                                                                                                    |
| `response`       | UC3 — Coordinate Emergency Response & Resources                                                                                         |
| `analytics`      | UC4 — Analyse Disaster & Generate Reports (no schema yet — reads/aggregates across the others; design its read model as part of the UC) |

See the root [`README.md`](../README.md) for setup steps, scripts, branching strategy,
and commit conventions.
