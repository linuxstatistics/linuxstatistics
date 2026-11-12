#!/usr/bin/env node
// Vercel build (Build Output API v3). Run from the repo root:
//   1. migrate the database (DATABASE_URL);
//   2. start the API on a local port and build the static site from it;
//   3. bundle the API as one Vercel Function serving /api/*;
//   4. write .vercel/output (static files, the function, routes, headers).
import { spawn } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, ".vercel/output");
const SITE = join(ROOT, "apps/site");
const PORT = Number(process.env.BUILD_API_PORT ?? 3099);
const NODE_RUNTIME = "nodejs24.x";

// Run the function next to the database. Neon hosts carry the AWS region.
const NEON_TO_VERCEL = { "us-east-1": "iad1", "us-east-2": "cle1", "us-west-2": "pdx1", "eu-central-1": "fra1", "eu-west-2": "lhr1", "ap-southeast-1": "sin1", "ap-southeast-2": "syd1" };
function functionRegion(url) {
  if (process.env.VERCEL_FUNCTION_REGION) return process.env.VERCEL_FUNCTION_REGION;
  try {
    const m = new URL(url).hostname.match(/\.([a-z]{2}-[a-z]+-\d)\.aws\.neon\.tech$/);
    if (m && NEON_TO_VERCEL[m[1]]) return NEON_TO_VERCEL[m[1]];
  } catch {}
  return "iad1";
}

/** Neon's direct (unpooled) host is the pooled one without "-pooler"; migrations prefer it. */
function directUrl(url) {
  try {
    const u = new URL(url);
    u.hostname = u.hostname.replace("-pooler.", ".");
    return u.toString();
  } catch {
    return url;
  }
}

const log = (m) => console.log(`vercel-build: ${m}`);

function run(cmd, args, opts = {}) {
  return new Promise((ok, fail) => {
    const p = spawn(cmd, args, { stdio: "inherit", cwd: ROOT, ...opts });
    p.on("exit", (code) => (code === 0 ? ok() : fail(new Error(`${cmd} ${args.join(" ")} exited ${code}`))));
  });
}

async function waitForHealth(url, ms = 60_000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`API did not become healthy at ${url}`);
}

/** Copy a package and everything it depends on (resolved through pnpm's store) into dest/node_modules. */
function copyPackageTree(name, fromDir, dest) {
  const seen = new Set();
  const visit = (pkgName, resolveFrom) => {
    if (seen.has(pkgName)) return;
    const req = createRequire(join(resolveFrom, "package.json"));
    let dir;
    try {
      dir = dirname(req.resolve(`${pkgName}/package.json`));
    } catch {
      let m = dirname(req.resolve(pkgName));
      while (!existsSync(join(m, "package.json"))) m = dirname(m);
      dir = m;
    }
    dir = realpathSync(dir);
    seen.add(pkgName);
    cpSync(dir, join(dest, "node_modules", pkgName), {
      recursive: true,
      dereference: true,
      // Native prebuilds: Vercel Functions run on linux-x64 (glibc).
      filter: (src) => !/[\\/]prebuilds[\\/](?!linux-x64(?:[\\/]|$))[^\\/]+/.test(src),
    });
    const pj = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
    for (const d of Object.keys({ ...pj.dependencies, ...pj.optionalDependencies })) visit(d, dir);
  };
  visit(name, fromDir);
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set for this build");
  rmSync(OUT, { recursive: true, force: true });

  // 1–2. Start the API (it migrates on start), then build the site from it.
  log("starting the API for the site build");
  const api = spawn(join(ROOT, "apps/api/node_modules/.bin/tsx"), ["apps/api/src/server.ts"], {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: directUrl(process.env.DATABASE_URL), PORT: String(PORT), HOST: "127.0.0.1", API_CACHE_TTL_MS: "600000" },
  });
  const apiExit = new Promise((_, fail) => api.on("exit", (c) => fail(new Error(`API exited early (${c})`))));
  try {
    await Promise.race([waitForHealth(`http://127.0.0.1:${PORT}/health`), apiExit]);
    log("building the site");
    await Promise.race([
      run(join(SITE, "node_modules/.bin/astro"), ["build"], { cwd: SITE, env: { ...process.env, API_URL: `http://127.0.0.1:${PORT}` } }),
      apiExit,
    ]);
  } finally {
    api.removeAllListeners("exit");
    api.kill();
  }
  if (process.env.SKIP_SITE_CHECK !== "1") await run("bash", ["scripts/check-site.sh"], { env: { ...process.env, DIST: join(SITE, "dist") } });
  cpSync(join(SITE, "dist"), join(OUT, "static"), { recursive: true });

  // 3. The API as one function. sodium-native (session cookies) is a native addon, so it ships unbundled.
  log("bundling the API function");
  const fn = join(OUT, "functions/api.func");
  mkdirSync(fn, { recursive: true });
  await build({
    entryPoints: [join(ROOT, "apps/api/src/vercel.ts")],
    outfile: join(fn, "index.mjs"),
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node24",
    external: ["sodium-native"],
    // The function always uses Postgres (openDb throws in production without DATABASE_URL),
    // so the local PGlite driver is replaced with a stub instead of shipping its 10 MB of WASM.
    plugins: [
      {
        name: "no-pglite",
        setup(b) {
          b.onResolve({ filter: /^@electric-sql\/pglite$/ }, () => ({ path: "pglite-stub", namespace: "stub" }));
          b.onLoad({ filter: /.*/, namespace: "stub" }, () => ({
            contents:
              "export const types = {}; export class PGlite { constructor() { throw new Error('PGlite is not available in the Vercel function'); } }",
          }));
        },
      },
    ],
    banner: { js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);" },
    logLevel: "warning",
  });
  const sessionPkg = dirname(createRequire(join(ROOT, "apps/api/package.json")).resolve("@fastify/secure-session/package.json"));
  copyPackageTree("sodium-native", realpathSync(sessionPkg), fn);
  writeFileSync(join(fn, "package.json"), JSON.stringify({ type: "module" }));
  writeFileSync(
    join(fn, ".vc-config.json"),
    JSON.stringify(
      { runtime: NODE_RUNTIME, handler: "index.mjs", launcherType: "Nodejs", maxDuration: 15, regions: [functionRegion(process.env.DATABASE_URL)] },
      null,
      2,
    ),
  );

  // 4. Routes: security headers, cache headers, static files first, /api/* to the function, then the 404 page.
  const security = {
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };
  const config = {
    version: 3,
    routes: [
      { src: "^/(.*)$", headers: security, continue: true },
      { src: "^/_astro/(.*)$", headers: { "Cache-Control": "public, max-age=31536000, immutable" }, continue: true },
      { src: "^/api/(.*)$", headers: { "Cache-Control": "no-store" }, continue: true },
      { handle: "filesystem" },
      { src: "^/api/.*$", dest: "/api" },
      // Directory pages without a trailing slash (e.g. /rising) serve their index.html.
      { src: "^/(.*[^/])$", dest: "/$1/index.html", check: true },
      { handle: "error" },
      { status: 404, src: "^(?!/api).*$", dest: "/404.html" },
    ],
  };
  writeFileSync(join(OUT, "config.json"), JSON.stringify(config, null, 2));
  log(`done: ${OUT}`);
}

main().catch((err) => {
  console.error(`vercel-build: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
