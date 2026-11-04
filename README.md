# LinuxStatistics

Linux-distro statistics with a 3D hook: the distro landscape as a **solar system** (Sun = #1 distro, planets = ranks #2–#9, starfield = the long tail) and as a **sortable leaderboard**. Signed-in users can rate distros, mark "I use this" and leave short reviews.

## Stack

- **web**: Vite + React + react-three-fiber SPA (Galaxy + List views)
- **api**: Fastify REST API over the database (read-only data routes, plus auth, contributions and email signup)
- **worker**: ingestion source parsers (DistroWatch / StatCounter / GitHub) and seed
- **packages/db**: Drizzle schema, migrations, queries, repository
- **packages/shared**: zod domain and API-DTO schemas

### Planet textures

The Galaxy view uses planet textures from [Solar System Scope](https://www.solarsystemscope.com/textures/), licensed **CC BY 4.0**. They are not committed; fetch them with:

```bash
bash scripts/fetch-textures.sh   # → apps/web/public/textures/planets/
```

### Database

Local dev and tests use **PGlite** (in-process Postgres), so no database server is needed. The same Drizzle schema and migrations target a real Postgres in production via `createPostgresDb()` in `packages/db`. The local database lives at `.data/pglite` (override with `PGLITE_DIR`).

## Local setup

```bash
pnpm install
pnpm seed       # seed the local PGlite database (exits)
pnpm dev:api    # http://localhost:3001
pnpm dev:web    # http://localhost:5173 (another terminal)
```

PGlite allows a single connection, so run `pnpm seed` before starting the API. Run both from the repo root.

## Tests and checks

```bash
pnpm test
pnpm typecheck
```

## Ingestion

`apps/worker/src/run.ts` is the ingestion entrypoint (fetch → parse → write, keeping the last good data on failure): `pnpm --filter @linux-statistics/worker ingest`.

## Attribution

Planet textures © Solar System Scope, CC BY 4.0. Ranking data sources are credited on the site.
