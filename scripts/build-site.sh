#!/usr/bin/env bash
# Build the Astro site from the running API, then swap it into place.
# A failed build leaves the previous apps/site/dist untouched.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SITE="$ROOT/apps/site"
NEXT="$SITE/dist.next"
PREV="$SITE/dist.prev"

: "${API_URL:=http://localhost:3001}"
export API_URL

if ! curl -fsS "$API_URL/health" >/dev/null; then
  echo "build-site: API not reachable at $API_URL (start it with: pnpm dev:api)" >&2
  exit 1
fi

rm -rf "$NEXT"
(cd "$SITE" && pnpm exec astro build --outDir "$NEXT")

rm -rf "$PREV"
if [ -d "$SITE/dist" ]; then mv "$SITE/dist" "$PREV"; fi
mv "$NEXT" "$SITE/dist"
rm -rf "$PREV"
echo "build-site: apps/site/dist updated"
