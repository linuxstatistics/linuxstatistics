#!/usr/bin/env bash
# Bot-view check: the built HTML must carry the data without JavaScript.
set -euo pipefail
DIST="$(cd "$(dirname "$0")/.." && pwd)/apps/site/dist"
fail=0
check() { # file, pattern, label
  if grep -q -- "$2" "$DIST/$1"; then echo "ok:   $3"; else echo "FAIL: $3 ($1 lacks '$2')"; fail=1; fi
}
[ -f "$DIST/index.html" ] || { echo "FAIL: no build at $DIST (run pnpm build:site)"; exit 1; }
check index.html '<table class="leaderboard"' "home has the leaderboard table"
check index.html 'application/ld+json' "home has JSON-LD"
check index.html 'rel="canonical"' "home has a canonical link"
first=$(ls "$DIST/distro" | head -1)
check "distro/$first/index.html" '<dl class="stats">' "distro page /distro/$first/ has stats"
check "distro/$first/index.html" 'DistroWatch' "distro page credits DistroWatch"
check rising/index.html '<table class="data-table"' "rising page has its table"
check compare/index.html 'class="pair-list"' "compare page lists popular pairs"
pair=$(ls "$DIST/compare" | grep -- -vs- | head -1)
check "compare/$pair/index.html" 'compare-table' "compare pair /compare/$pair/ has the table"
check pick/index.html 'Which distro?' "picker page renders"
[ -f "$DIST/favicon.svg" ] && echo "ok:   favicon" || { echo "FAIL: favicon missing"; fail=1; }
[ -f "$DIST/sitemap-index.xml" ] && echo "ok:   sitemap" || { echo "FAIL: sitemap missing"; fail=1; }
[ -f "$DIST/robots.txt" ] && echo "ok:   robots.txt" || { echo "FAIL: robots.txt missing"; fail=1; }
[ -f "$DIST/404.html" ] && echo "ok:   404 page" || { echo "FAIL: 404 page missing"; fail=1; }
echo "distro pages: $(ls "$DIST/distro" | wc -l | tr -d ' ')"
exit $fail
