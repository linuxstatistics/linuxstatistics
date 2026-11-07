# LinuxStatistics

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)

Linux-distro statistics: popularity rankings, desktop market share and project activity in a **sortable leaderboard**, plus a page per distro, a monthly "rising" list, side-by-side comparisons and a "which distro should I use?" picker. Signed-in users can rate distros, mark "I use this" and leave short reviews.

## Stack

- **site**: Astro static site with React islands (leaderboard and a page per distro)
- **api**: Fastify REST API over the database (read-only data routes, plus auth, contributions and email signup)
- **worker**: ingestion source parsers (DistroWatch / StatCounter / GitHub) and seed
- **packages/db**: Drizzle schema, migrations, queries, repository
- **packages/shared**: zod domain and API-DTO schemas

### Database

Local dev and tests use **PGlite** (in-process Postgres), so no database server is needed. The local database lives at `.data/pglite` (override with `PGLITE_DIR`). Set `DATABASE_URL` to use a real Postgres instead (production); the API, worker and seed then share it, and migrations run on start.

## Local setup

```bash
pnpm install
pnpm seed       # seed the local PGlite database (exits)
pnpm dev:api    # API on http://localhost:3001
pnpm dev:site   # site on http://localhost:4380 (another terminal; proxies /api to the API)
```

PGlite allows a single connection, so run `pnpm seed` before starting the API. Run both from the repo root.

## Building the site

The site is built from the running API, so every page is plain HTML:

```bash
pnpm build:site   # needs the API running (API_URL, default http://localhost:3001)
pnpm check:site   # checks the built HTML has the data without JavaScript
```

`build:site` builds into a temporary folder and only replaces `apps/site/dist` when the build succeeds. In production, serve `apps/site/dist` and route `/api/*` to the API on the same origin.

## Tests and checks

```bash
pnpm test
pnpm typecheck
```

## Ingestion

```bash
pnpm --filter @linux-statistics/worker ingest                      # all sources
pnpm --filter @linux-statistics/worker ingest --source distrowatch  # one source
pnpm --filter @linux-statistics/worker ingest --source statcounter --backfill   # full history since 2009
pnpm --filter @linux-statistics/worker ingest --source all --rebuild            # then rebuild the site
```

Sources: DistroWatch page-hit rankings (daily), GitHub repository activity (weekly; set `GITHUB_TOKEN` for a higher rate limit), StatCounter desktop market share (monthly), English Wikipedia page views for our own interest index (monthly; CC0, compared with the current rank on `/admin/rank/` before it's used) and Wikidata distro facts (weekly; CC0: base, first release, homepage, and distros we don't track yet, which stay unlisted until they have a rank, repo or rating). Wikidata only fills empty fields; curated values win. Each source runs on its own: a failure is recorded, the last good data stays, and the other sources still run. The exit code is non-zero if any source failed.

With PGlite, stop the API before ingesting (PGlite allows one connection). With Postgres they can run together.

After the monthly StatCounter run, `pnpm --filter @linux-statistics/worker monthly` writes the month's summary (Markdown, HTML email, 1200×630 share card) from the API; `--draft` also creates a Resend Broadcast draft for review (nothing is sent automatically).

`deploy/` has example systemd units and timers for a server (`deploy/worker.env.example` lists the settings).

## Attribution

Ranking data comes from DistroWatch, StatCounter Global Stats and GitHub, and is credited on the site.

## License

[GNU Affero General Public License v3.0](LICENSE). If you run a modified version as a network service, you must offer its source to its users.
