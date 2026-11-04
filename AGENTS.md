# AGENTS.md

Instructions for coding agents working in this repository.

## Scope

This repository holds code only. Don't add `docs/`, `.specify/`, `specs/` or `research/` directories, and don't commit planning notes, strategy or reports. Commit messages describe the code change only.

Don't commit or push without the maintainer's go-ahead. Don't create remotes or deploy.

## What this is

LinuxStatistics: Linux-distro statistics in a sortable leaderboard with distro details. Data is bootstrapped from DistroWatch rankings, StatCounter market share and GitHub activity. The long-term direction is first-party, user-contributed data (ratings, reviews, "I use this"); treat scraped data as a bootstrap. Domains: `linuxstatistics.com`, `linuxrankings.com`.

## Commands

Run everything from the repo root (the local DB path is anchored to it).

```bash
pnpm install
pnpm seed          # populate the local DB (run before the API)
pnpm dev:api       # Fastify API on http://localhost:3001
pnpm dev:web       # Vite SPA on http://localhost:5173 (separate terminal)

pnpm test                         # full vitest suite
pnpm test -- queries              # files matching "queries"
pnpm test -- -t "biggest climber" # tests matching a name
pnpm typecheck                    # tsc --noEmit across every package

```

DB schema changes: edit `packages/db/src/schema.ts`, then `pnpm --filter @linux-statistics/db db:generate` to emit a migration into `packages/db/drizzle/`. Migrations apply automatically on DB init (`initPgliteDb`); tests migrate an in-memory DB per file.

## Architecture

pnpm-workspace monorepo (`packages/*`, `apps/*`), TypeScript, ESM. Data flows one way: **worker → Postgres → api → web**.

- `packages/shared`: zod schemas and inferred types. `schemas.ts` = domain entities, `views.ts` = the API-DTO contract (`DistroListItem`, `DistroDetail`, `GalaxyPayload`, …). Single source of truth for shapes.
- `packages/db`: Drizzle schema, migrations; the only package that touches the DB. `queries.ts` = reads returning view DTOs (API); `repository.ts`, `contributions.ts`, `email.ts` = writes. Top-N membership is derived at query time, never stored.
- `apps/worker`: ingestion. `src/sources/*` are pure parsers (DistroWatch HTML, StatCounter CSV, GitHub JSON) tested against fixtures; `src/seed.ts` loads `seed-data.ts`; `src/run.ts` is the live ingestion entrypoint.
- `apps/api`: Fastify. Public data routes are read-only and never scrape on a request. Write routes (auth, contributions, email signup, admin moderation) are isolated in `src/routes/`. `buildApp(db)` takes an injected db (tests use in-memory PGlite + `inject()`).
- `apps/web`: Vite + React SPA. TanStack Query for data; `store.ts` (Zustand) holds `selectedSlug`.

**Ingestion rule:** each source is isolated and idempotent; on failure it records a failed run and keeps the last good data. Never overwrite good data with partial or garbage data.

## Data layer

Local dev and tests use **PGlite** (in-process Postgres); production uses `createPostgresDb()` (postgres-js). Same schema and migrations target both.

- The local PGlite dir is `<root>/.data/pglite` (override `PGLITE_DIR`). Run seed and api from the repo root.
- PGlite is single-connection: `pnpm seed` must finish before the API opens the same dir.

## Auth and contributions

Write endpoints require a session. Sign-in uses OAuth2 with GitHub, GitLab or Codeberg; a provider is enabled only when both its client id and secret are set. Never commit a `.env`.

- Base: `SESSION_SECRET` (>= 32 chars), `API_PUBLIC_URL`, `WEB_ORIGIN`.
- Per provider (callback `${API_PUBLIC_URL}/api/auth/<provider>/callback`): `GITHUB_OAUTH_CLIENT_ID/SECRET`, `GITLAB_OAUTH_CLIENT_ID/SECRET`, `CODEBERG_OAUTH_CLIENT_ID/SECRET`.
- Each `(provider, provider_user_id)` is an independent account; accounts are never linked across forges.
- Local dev without OAuth: `ALLOW_DEV_LOGIN=1`, then POST `/api/auth/dev-login` `{ providerUserId, username, provider?, role? }`. Off in production. Tests use `apps/api/test/helpers.ts:loginAs`.

## Site config (public, no secrets)

- `apps/web/src/config/affiliate.ts`: provider referral links. Empty array hides the block.
- `apps/web/src/config/sponsor.ts`: `sponsor` record or `null` (house ad); `sponsorContactHref`.
- Email capture: `POST /api/email-signups` (public, rate-limited); export via `GET /api/admin/email-signups` (admin). Collect only; no sending.

## Frontend gotchas

- The List table is config-driven (`COLUMNS` array with per-column `render` and sort key) with show/hide toggles.
- `GET /api/galaxy` is an API-only payload; the web app doesn't call it.
- Uppercasing is CSS `text-transform`, not DOM text, so tests match real labels.

## Testing

Vitest at the root. Web tests run under jsdom (`environmentMatchGlobs`, `esbuild.jsx: "automatic"`, `@testing-library/jest-dom/vitest`). Parsers, queries, zod schemas and API endpoints carry the coverage. Parser changes need a saved fixture under `apps/worker/test/fixtures/`.
