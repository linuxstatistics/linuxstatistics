# LinuxStatistics

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)

Linux-distro statistics: popularity rankings, desktop market share and project activity in a **sortable leaderboard**. Signed-in users can rate distros, mark "I use this" and leave short reviews.

## Stack

- **site**: Astro static site with React islands (leaderboard and a page per distro)
- **api**: Fastify REST API over the database (read-only data routes, plus auth, contributions and email signup)
- **worker**: ingestion source parsers (DistroWatch / StatCounter / GitHub) and seed
- **packages/db**: Drizzle schema, migrations, queries, repository
- **packages/shared**: zod domain and API-DTO schemas

### Database

Local dev and tests use **PGlite** (in-process Postgres), so no database server is needed. The same Drizzle schema and migrations target a real Postgres in production via `createPostgresDb()` in `packages/db`. The local database lives at `.data/pglite` (override with `PGLITE_DIR`).

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

`apps/worker/src/run.ts` is the ingestion entrypoint (fetch → parse → write, keeping the last good data on failure): `pnpm --filter @linux-statistics/worker ingest`.

## Attribution

Ranking data comes from DistroWatch, StatCounter Global Stats and GitHub, and is credited on the site.

## License

[GNU Affero General Public License v3.0](LICENSE). If you run a modified version as a network service, you must offer its source to its users.
