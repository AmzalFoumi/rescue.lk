# Agent instructions for rescue.lk

**Read [`docs/setup-notes.md`](docs/setup-notes.md) first** — this scaffold deviates
from common defaults (npm not pnpm, MongoDB Atlas not Postgres, ESM imports in
`apps/api`, Vitest+oxlint not Jest+ESLint, a types-only shared package, specific
coverage exclusions) in ways that aren't obvious from the code alone.

Hard rules that must not be "corrected" without re-reading that doc first:

- `apps/api` relative imports require an explicit `.js` suffix (e.g.
  `'./foo.service.js'`) even though the source is `.ts` — this is ESM/NodeNext, not a
  typo.
- No local database container. `MONGODB_URI` in `apps/api/.env` points at a MongoDB
  Atlas cluster (free tier) — do not add `docker-compose.yml` DB services.
- Do not add runtime code (real enums, constants, functions) to `packages/shared`
  without first adding a build step — it currently ships types only, no compile step.
- Do not commit with a `Co-Authored-By: Claude` (or similar AI attribution) trailer —
  this repo's owner runs all commits under their own identity.
- This repo is a scaffold: 4 use-case modules (`warnings`, `hazard-reports`,
  `response`, `analytics`) exist only as skeletons. Don't implement business logic for
  a module you weren't asked to work on.

See the root [`README.md`](README.md) for setup, scripts, branching, and commit
conventions.
