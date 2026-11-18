#!/usr/bin/env bash
# Bot-view check: the built HTML must carry the data without JavaScript.
set -euo pipefail
DIST="${DIST:-$(cd "$(dirname "$0")/.." && pwd)/apps/site/dist}"
echo "checking: $DIST ($(date -r "$DIST/index.html" "+%Y-%m-%d %H:%M" 2>/dev/null || echo "no index.html"))"
fail=0
check() { # file, pattern, label
  if grep -q -- "$2" "$DIST/$1"; then echo "ok:   $3"; else echo "FAIL: $3 ($1 lacks '$2')"; fail=1; fi
}
[ -f "$DIST/index.html" ] || { echo "FAIL: no build at $DIST (run pnpm build:site)"; exit 1; }
check index.html '<table class="leaderboard"' "home has the leaderboard table"
check index.html 'application/ld+json' "home has JSON-LD"
check index.html 'rel="canonical"' "home has a canonical link"
first=$(ls "$DIST/distro" | head -1)
check "distro/$first/index.html" '<dl class="dstats-pop"' "distro page /distro/$first/ has stats"
check "distro/$first/index.html" 'class="source-note"' "distro page credits its sources"
check rising/index.html '<table class="leaderboard rising-table"' "rising page has its table"
check compare/index.html 'class="pair-list"' "compare page lists popular pairs"
pair=$(ls "$DIST/compare" | grep -- -vs- | head -1)
check "compare/$pair/index.html" 'compare-table' "compare pair /compare/$pair/ has the table"
check pick/index.html 'Which distro?' "picker page renders"
check switch/getting-started/index.html 'Your Mint next steps' "getting-started guide has distro-specific instructions"
check switch/getting-started/index.html 'Your Ubuntu next steps' "getting-started guide includes Ubuntu"
check switch/getting-started/index.html 'Your Bazzite next steps' "getting-started guide includes Bazzite"
check about/ratings/index.html 'smoothed average' "ratings explainer renders"
check about/index.html 'Where the numbers come from' "about page renders"
check privacy/index.html 'Your rights' "privacy page renders"
check terms/index.html 'Ratings and reviews' "terms page renders"
check sponsors/index.html "doesn't buy" "sponsors page renders"
# Sponsor rates are quoted by email, never published.
if sed -e 's/<script[^>]*>.*<\/script>//g' "$DIST/sponsors/index.html" | grep -qE '\$[0-9]'; then echo "FAIL: sponsors page shows a price"; fail=1; else echo "ok:   sponsors page shows no prices"; fi
check suggest/index.html 'Suggestions' "suggest page renders"
check data/index.html 'CC BY 4.0' "open data page renders"
check data/index.html '/api/v1/distros' "open data page documents the v1 API"
check data/distros.json '"license": "CC-BY-4.0"' "distros.json carries its licence"
check data/distros.csv 'slug,name,family' "distros.csv has its header"
check data/notes.json '"pros"' "notes.json has editorial data"
check data/market-share.csv 'month,region,platform' "market-share.csv has its header"
monthly=$(ls "$DIST/monthly" 2>/dev/null | grep -E '^[0-9]{4}-[0-9]{2}\.png$' | head -1)
if [ -n "$monthly" ]; then echo "ok:   monthly card /monthly/$monthly"; else echo "FAIL: no /monthly/YYYY-MM.png card"; fail=1; fi
check switch/index.html 'href="/switch/windows/"' "switch chooser links both pages"
check switch/windows/index.html '12 October 2027' "Windows switch page has the ESU date"
check switch/windows/index.html 'apps-table' "Windows switch page has the app table"
check switch/windows/index.html 'FAQPage' "Windows switch page has FAQ JSON-LD"
check switch/mac/index.html 'Asahi' "Mac switch page covers Apple Silicon"
check switch/mac/index.html 'apps-table' "Mac switch page has the app table"
check distro/mint/index.html 'href="/switch/windows/"' "Mint links to the Windows switch page"
check desktop-share/index.html 'sc-growth' "desktop share page has the growth table"
check desktop-share/index.html 'class="sc-line os-windows"' "desktop share chart renders without JS"
check desktop-share/index.html 'StatCounter' "desktop share page credits StatCounter"
check index.html 'href="/desktop-share/"' "home links to the desktop share page"
[ -f "$DIST/favicon.svg" ] && echo "ok:   favicon" || { echo "FAIL: favicon missing"; fail=1; }
[ -f "$DIST/sitemap-index.xml" ] && echo "ok:   sitemap" || { echo "FAIL: sitemap missing"; fail=1; }
[ -f "$DIST/robots.txt" ] && echo "ok:   robots.txt" || { echo "FAIL: robots.txt missing"; fail=1; }
[ -f "$DIST/404.html" ] && echo "ok:   404 page" || { echo "FAIL: 404 page missing"; fail=1; }
# External links must open in a new tab (keep visitors on the site).
same_tab=$(grep -rhoE '<a [^>]*href="https?://[^"]*"[^>]*>' "$DIST" --include=*.html | grep -v 'target="_blank"' | grep -v 'href="https://linuxstatistics.com' | sort -u | head -5 || true)
if [ -n "$same_tab" ]; then echo "FAIL: external links without target=\"_blank\":"; echo "$same_tab"; fail=1; else echo "ok:   external links open in a new tab"; fi
# Open data never carries third-party ranking data.
if grep -qiE 'rank_|hits_per_day|hitsPerDay|distrowatch|index_value' "$DIST/data/distros.json" "$DIST/data/distros.csv"; then echo "FAIL: open data carries ranking fields"; fail=1; else echo "ok:   open data has no ranking fields"; fi
# Press kit: page, zip and every asset it links to.
if [ -f "$DIST/press/index.html" ] && [ -f "$DIST/press/PressKit.zip" ]; then echo "ok:   press kit page and zip"; else echo "FAIL: press kit page or zip missing"; fail=1; fi
missing=$(grep -oE 'href="/press/[^"]+"' "$DIST/press/index.html" | sed -E 's/href="\/press\/([^"]+)"/\1/' | sort -u | while read -r f; do [ -f "$DIST/press/$f" ] || echo "$f"; done)
if [ -n "$missing" ]; then echo "FAIL: press kit links to missing files:"; echo "$missing"; fail=1; else echo "ok:   every press kit link resolves"; fi
# The public rank is our composite index: no page may still call the value "hits".
if grep -rlE 'Hits ?/ ?day|Hits per day|page-hit rankings|<small>/day</small>' "$DIST/index.html" "$DIST/distro" "$DIST/compare" "$DIST/rising" >/dev/null 2>&1; then echo "FAIL: a page still labels the index as hits"; fail=1; else echo "ok:   index never labelled as hits"; fi
if grep -q 'composite index' "$DIST/distro/mint/index.html" && grep -q 'id="ranking"' "$DIST/about/index.html"; then echo "ok:   rank credit names the composite index and /about/#ranking exists"; else echo "FAIL: rank credit or /about/#ranking missing"; fail=1; fi
[ ! -e "$DIST/data/rank-history.csv" ] && [ ! -d "$DIST/badge" ] && echo "ok:   no rank exports or badges" || { echo "FAIL: rank-history.csv or badges still built"; fail=1; }
check feed.xml '<feed xmlns="http://www.w3.org/2005/Atom">' "site Atom feed is built"
check distro/mint/feed.xml 'endoflife.date' "per-distro release feed credits its source"
# Feeds are an export: no rank numbers, scores or hits.
if grep -rliE '#[0-9]|rank_|hits|interest score|index_value' "$DIST/feed.xml" "$DIST"/distro/*/feed.xml >/dev/null 2>&1; then echo "FAIL: a feed carries ranking data"; fail=1; else echo "ok:   feeds carry no ranking data"; fi
check about/trademarks/index.html 'Corrections and removal' "trademarks page renders"
check index.html 'href="/about/trademarks/"' "footer links the trademarks page"
check marks.svg '<symbol id="m-arch"' "logo sprite is built"
check distro/fedora/index.html 'class="dmark' "distro page header shows its mark"
check distro/mint/index.html 'class="download-block"' "distro page has the download block"
check distro/mint/index.html 'href="/guides/verify-download/"' "download block links the verify guide"
check guides/verify-download/index.html 'Get-FileHash' "verify guide has the Windows command"
check changelog/index.html 'class="changelog-list"' "changelog page renders"
check changelog/index.html 'composite index' "changelog records the ranking method change"
check changelog/feed.xml '<feed xmlns="http://www.w3.org/2005/Atom">' "changelog feed is built"
check index.html 'href="/changelog/"' "footer links the changelog"
check distro/truenas/index.html 'Changes affecting' "distro page shows its changelog entries"
# The changelog feed is an export: no rank numbers or hits.
if grep -qiE '#[0-9]|rank_|hits_per_day|interest score|index_value' "$DIST/changelog/feed.xml"; then echo "FAIL: changelog feed carries ranking data"; fail=1; else echo "ok:   changelog feed has no ranking data"; fi
check best/index.html 'class="best-topics"' "best-for hub renders"
check best/gaming/index.html 'class="best-list"' "best-for topic page has picks"
check best/gaming/index.html '"ItemList"' "best-for page has ItemList JSON-LD"
check best/gaming/index.html '/pick/?a=' "best-for page links the pre-filled quiz"
check telemetry/index.html 'class="ref-list"' "telemetry page renders"
check support-dates/index.html 'class="data-table support-table"' "support dates page renders"
check index.html '"@type":"Organization"' "every page has Organization JSON-LD"
check index.html 'creativecommons.org/licenses/by/4.0' "home Dataset carries the data licence"
# Google's Dataset check needs creator spelled out (type and name), not an @id-only reference.
for f in "$DIST/index.html" "$DIST/data/index.html"; do
  if python3 -c 'import json,re,sys; s=open(sys.argv[1]).read(); ds=[n for b in re.findall(r"<script type=\"application/ld\+json\">(.*?)</script>",s,re.S) for n in (json.loads(b).get("@graph") or [json.loads(b)]) if n.get("@type")=="Dataset"]; sys.exit(0 if ds and all(isinstance(d.get("creator"),dict) and d["creator"].get("@type") and d["creator"].get("name") for d in ds) else 1)' "$f"; then echo "ok:   Dataset creator has a type and name in ${f#$DIST/}"; else echo "FAIL: Dataset creator missing type or name in ${f#$DIST/}"; fail=1; fi
done
check distro/mint/index.html '"BreadcrumbList"' "distro page has BreadcrumbList JSON-LD"
check distro/mint/index.html '"FAQPage"' "distro page has FAQ JSON-LD"
# Thin best-for topics are noindex and stay out of the sitemap.
for f in "$DIST"/best/*/index.html; do
  slug=$(basename "$(dirname "$f")")
  if grep -q 'name="robots" content="noindex"' "$f" && grep -q "/best/$slug/" "$DIST"/sitemap-*.xml; then echo "FAIL: noindex /best/$slug/ is in the sitemap"; fail=1; fi
done
echo "ok:   noindex best-for topics kept out of the sitemap"
# Reference pages are exports of our facts: no rank numbers or hits on telemetry/support pages.
if grep -qiE 'hitsPerDay|hits_per_day|interest score' "$DIST/telemetry/index.html" "$DIST/support-dates/index.html"; then echo "FAIL: a reference page carries ranking data"; fail=1; else echo "ok:   reference pages have no ranking data"; fi
check llms.txt '# LinuxStatistics' "llms.txt is built"
check llms-full.txt '## Mint' "llms-full.txt lists distro facts"
check data/index.html '"@type":"Dataset"' "open data page has Dataset JSON-LD"
check distro/mint/index.html 'class="key-facts"' "distro page has key facts"
check "compare/$pair/index.html" 'key-facts-pair' "compare pair has key facts"
# llms-full.txt is an export: no rank numbers or hits.
if grep -qiE '#[0-9]|ranked|rank_|hits|interest score|index_value' "$DIST/llms-full.txt"; then echo "FAIL: llms-full.txt carries ranking data"; fail=1; else echo "ok:   llms-full.txt has no ranking data"; fi
check stats/index.html 'Linux by the numbers' "stats page renders"
# /stats is built from our totals: no rank numbers or hits.
if grep -qiE 'hitsPerDay|hits_per_day|interest score' "$DIST/stats/index.html"; then echo "FAIL: stats page carries ranking data"; fail=1; else echo "ok:   stats page has no ranking data"; fi
check articles/index.html 'Notes and analysis' "articles list renders"
# Drafts never reach a production build.
if grep -rlqE 'article-draft-banner|article-draft-tag|Draft, not published' "$DIST/articles" 2>/dev/null; then echo "FAIL: a draft article is in the build"; fail=1; else echo "ok:   no draft articles in the build"; fi
echo "distro pages: $(ls "$DIST/distro" | wc -l | tr -d ' ')"
exit $fail
