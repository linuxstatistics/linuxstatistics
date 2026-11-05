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
pnpm dev:site      # Astro dev server on http://localhost:4380, proxies /api (separate terminal)
pnpm build:site    # static build from the running API (API_URL), atomic swap into apps/site/dist
pnpm check:site    # bot-view check of the built HTML
pnpm --filter @linux-statistics/worker ingest --source distrowatch|github|statcounter|all [--backfill] [--rebuild]
pnpm --filter @linux-statistics/worker monthly [--out DIR] [--draft]   # monthly summary + share card from the API

pnpm test                         # full vitest suite
pnpm test -- queries              # files matching "queries"
pnpm test -- -t "biggest climber" # tests matching a name
pnpm typecheck                    # tsc --noEmit across every package

```

DB schema changes: edit `packages/db/src/schema.ts`, then `pnpm --filter @linux-statistics/db db:generate` to emit a migration into `packages/db/drizzle/`. Migrations apply automatically on DB init (`initPgliteDb`); tests migrate an in-memory DB per file.

## Architecture

pnpm-workspace monorepo (`packages/*`, `apps/*`), TypeScript, ESM. Data flows one way: **worker → Postgres → api → site** (the site is rebuilt from the API).

- `packages/shared`: zod schemas and inferred types. `schemas.ts` = domain entities, `views.ts` = the API-DTO contract (`DistroListItem`, `DistroDetail`, `GalaxyPayload`, …). Single source of truth for shapes.
- `packages/db`: Drizzle schema, migrations; the only package that touches the DB. `queries.ts` = reads returning view DTOs (API); `repository.ts`, `contributions.ts`, `email.ts` = writes. Top-N membership is derived at query time, never stored.
- `apps/worker`: ingestion. `src/sources/*` are pure parsers (DistroWatch HTML, StatCounter CSV, GitHub JSON) tested against fixtures. `ingest-*.ts` write one source each; `sources-run.ts` runs sources in isolation and records `ingestion_runs`; `run.ts` is the CLI. `http.ts` (`politeGet`) sets the bot User-Agent, retries 5xx and stops on 403/429; all fetchers take an injectable `fetch` so tests use no network. Curated data: `families.ts` (family/base per DistroWatch key), `github-repos.ts` (repo per distro). `monthly/` builds the monthly summary, a Satori/resvg share card and an optional Resend Broadcast draft (never sends). `seed.ts` loads the saved DistroWatch page.
- `apps/api`: Fastify. Public data routes are read-only and never scrape on a request. Write routes (auth, contributions, email signup, admin moderation) are isolated in `src/routes/`. `buildApp(db)` takes an injected db (tests use in-memory PGlite + `inject()`).
- `apps/site`: Astro 7 static site. Pages in `src/pages` (`index.astro`, `distro/[slug].astro`, `rising/`, `compare/` with prerendered top-10 pairs plus a client-side any-pair view, `pick/` quiz, 404, robots) read build-time data from the API through `src/lib/data.ts`, never the database. Interactive parts are React islands (`ListView`, `HeaderAuth`, `DistroRating`, `FooterEmail`, `StatsMenu`); each island wraps itself in `Island`, which shares one `QueryClient` so sign-in state reaches every island. Static parts (`DistroStats`, `ShareCard`, `AffiliateBlock`, `SponsorSlot`) render to HTML with no client JS.

**Ingestion rule:** each source is isolated and idempotent; on failure it records a failed run and keeps the last good data. Never overwrite good data with partial or garbage data.

## Data layer

`openDb()` picks the driver: Postgres when `DATABASE_URL` is set (production), otherwise local **PGlite**. Tests use in-memory PGlite. Same schema and migrations for both; `Database` is the driver-neutral Drizzle type. Distros are keyed by DistroWatch key (= slug); `distro_aliases` maps DistroWatch keys and legacy slugs. Snapshots carry a `period`; the main rank is `last-12-months`, "rising" uses `last-1-month`.

- The local PGlite dir is `<root>/.data/pglite` (override `PGLITE_DIR`). Run seed and api from the repo root.
- Zod 4: use `z.email()`, `z.url()`, `z.iso.datetime()` and `z.flattenError()`.
- PGlite is single-connection: `pnpm seed` and `ingest` must finish before the API opens the same dir (with Postgres they can run together).

## Auth and contributions

Write endpoints require a session. Sign-in uses OAuth2 with GitHub, GitLab or Codeberg; a provider is enabled only when both its client id and secret are set. Never commit a `.env`.

- Base: `SESSION_SECRET` (>= 32 chars, required when `NODE_ENV=production`), `API_PUBLIC_URL`, `WEB_ORIGIN` (site origin; OAuth returns here, default `http://localhost:4380`).
- Per provider (callback `${API_PUBLIC_URL}/api/auth/<provider>/callback`): `GITHUB_OAUTH_CLIENT_ID/SECRET`, `GITLAB_OAUTH_CLIENT_ID/SECRET`, `CODEBERG_OAUTH_CLIENT_ID/SECRET`.
- Each `(provider, provider_user_id)` is an independent account; accounts are never linked across forges.
- Admins: `ADMIN_USERS` (comma-separated `provider:#<id>` or `provider:<username>`, e.g. `github:#226349`). When set, matching accounts become admin at sign-in and unlisted admins are demoted. Admin pages live under `/admin/` (noindex, not in the sitemap, disallowed in robots.txt); the API enforces the role.
- Local dev without OAuth: `ALLOW_DEV_LOGIN=1`, then POST `/api/auth/dev-login` `{ providerUserId, username, provider?, role? }`. The API refuses to start with it when `NODE_ENV=production`. Dev logins follow `ADMIN_USERS` like real sign-ins. Tests use `apps/api/test/helpers.ts:loginAs`.

## Site config (public, no secrets)

- `apps/site/src/config/affiliate.ts`: provider referral links. Empty array hides the block.
- `apps/site/src/config/sponsor.ts`: `sponsor` record or `null` (house ad); `sponsorContactHref`.
- Email capture: `POST /api/email-signups` (public, rate-limited); export via `GET /api/admin/email-signups` (admin). Collect only; no sending.

## Frontend gotchas

- Island props must be serializable (plain data, no functions). Pass build-time data as props; fetch per-user data (`/api/me`, own contribution) inside the island.
- Islands call the API on the same origin (`/api/...`); set `PUBLIC_API_URL` only for a split-origin setup.
- Picker profiles live in `apps/site/src/lib/picker-profiles.ts` (data, not code); `picker.ts` scores them and never offers expert-only distros to beginners.
- The List table is config-driven (`COLUMNS` array with per-column `render` and sort key) with show/hide toggles.
- `GET /api/galaxy` is an API-only payload; the site doesn't call it.
- Uppercasing is CSS `text-transform`, not DOM text, so tests match real labels.

## Testing

Vitest 5 at the root with two projects in `vitest.config.ts`: `node` (packages, api, worker) and `site` (jsdom; `@testing-library/jest-dom/vitest`). `pnpm test -- --project site` runs one. Parsers, queries, zod schemas and API endpoints carry the coverage. Parser changes need a saved fixture under `apps/worker/test/fixtures/`.
