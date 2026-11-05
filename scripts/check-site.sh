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
check about/ratings/index.html 'smoothed average' "ratings explainer renders"
check about/index.html 'Where the numbers come from' "about page renders"
check privacy/index.html 'Your rights' "privacy page renders"
check terms/index.html 'Ratings and reviews' "terms page renders"
check sponsors/index.html "doesn't buy" "sponsors page renders"
check suggest/index.html 'Suggestions' "suggest page renders"
[ -f "$DIST/favicon.svg" ] && echo "ok:   favicon" || { echo "FAIL: favicon missing"; fail=1; }
[ -f "$DIST/sitemap-index.xml" ] && echo "ok:   sitemap" || { echo "FAIL: sitemap missing"; fail=1; }
[ -f "$DIST/robots.txt" ] && echo "ok:   robots.txt" || { echo "FAIL: robots.txt missing"; fail=1; }
[ -f "$DIST/404.html" ] && echo "ok:   404 page" || { echo "FAIL: 404 page missing"; fail=1; }
# External links must open in a new tab (keep visitors on the site).
same_tab=$(grep -rhoE '<a [^>]*href="https?://[^"]*"[^>]*>' "$DIST" --include=*.html | grep -v 'target="_blank"' | grep -v 'href="https://linuxstatistics.com' | sort -u | head -5 || true)
if [ -n "$same_tab" ]; then echo "FAIL: external links without target=\"_blank\":"; echo "$same_tab"; fail=1; else echo "ok:   external links open in a new tab"; fi
echo "distro pages: $(ls "$DIST/distro" | wc -l | tr -d ' ')"
exit $fail
