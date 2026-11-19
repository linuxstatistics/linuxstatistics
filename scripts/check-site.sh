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
check index.html 'class="mast-note mast-answer">' "home has the top-distros answer line"
check index.html 'drawing the most interest' "home answer line names the top distros"
check index.html '<ol class="podium" role="list"' "home podium is an ordered list"
# The ranking order for answer engines: ItemList starting at position 1, matching the podium's #1.
if python3 -c 'import json,re,sys; s=open(sys.argv[1]).read(); l=[n for b in re.findall(r"<script type=\"application/ld\+json\">(.*?)</script>",s,re.S) for n in (json.loads(b).get("@graph") or [json.loads(b)]) if n.get("@type")=="ItemList"]; m=re.search(r"<a class=\"pod\" href=\"([^\"]+)\"",s); e=l[0]["itemListElement"] if l else []; sys.exit(0 if e and e[0]["position"]==1 and m and e[0]["url"].endswith(m.group(1)) else 1)' "$DIST/index.html"; then echo "ok:   home ItemList starts at the podium #1"; else echo "FAIL: home ItemList missing or not starting at #1"; fail=1; fi
# Sort arrows are CSS, not text, so they stay out of snippets.
if grep -qE '<th[^>]*><button type="button">[^<]*[▲▼]' "$DIST/index.html"; then echo "FAIL: sort arrow in table header text"; fail=1; else echo "ok:   no sort arrow text in table headers"; fi
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
# Plain bash comparison: the build image has no cmp.
[ -f "$DIST/sitemap.xml" ] && [ "$(cat "$DIST/sitemap.xml")" = "$(cat "$DIST/sitemap-index.xml")" ] && echo "ok:   /sitemap.xml is the sitemap index" || { echo "FAIL: /sitemap.xml missing or differs from sitemap-index.xml"; fail=1; }
# lastmod is the content date, never the build time: a whole day (the writer adds T00:00:00.000Z), no time of day.
if grep -oE '<lastmod>[^<]*</lastmod>' "$DIST"/sitemap-[0-9]*.xml | grep -qvE '<lastmod>[0-9]{4}-[0-9]{2}-[0-9]{2}(T00:00:00\.000Z)?</lastmod>'; then echo "FAIL: sitemap lastmod carries a build timestamp"; fail=1; else echo "ok:   sitemap lastmod values are dates"; fi
grep -q '<loc>https://[^<]*/articles/how-we-rank-distros/</loc><lastmod>[0-9]' "$DIST"/sitemap-[0-9]*.xml && echo "ok:   articles have a lastmod" || { echo "FAIL: article without lastmod in the sitemap"; fail=1; }
# The islands' list is internal: disallowed for crawlers and never in the sitemap.
check robots.txt 'Disallow: /lists/' "robots.txt disallows /lists/"
# Search-result lengths (Bing flags long titles and long or short descriptions). Limits in scripts/check-meta.py.
if out=$(python3 "$(dirname "$0")/check-meta.py" "$DIST"); then echo "ok:   ${out##*$'\n'}"; else echo "$out" | sed 's/^/FAIL: /'; fail=1; fi
# A bare `animation:` shorthand minifies to `animation:none` and silently kills
# the named keyframes set elsewhere (seen on the brand mark, 2026-11-18).
if grep -oE '^[^@]*\{[^}]*animation:none' "$DIST"/_astro/*.css 2>/dev/null | grep -qv 'prefers-reduced-motion'; then
  echo "FAIL: minified CSS has animation:none outside reduced-motion (bare animation shorthand?)"; fail=1
else echo "ok:   no animation:none outside reduced-motion blocks"; fi
check lists/distros.json '"fields":\["slug","name"' "islands' distro list is built"
if grep -q '/lists/' "$DIST"/sitemap-*.xml; then echo "FAIL: /lists/ is in the sitemap"; fail=1; else echo "ok:   /lists/ kept out of the sitemap"; fi
# Page weight: distro lists load from /lists/, not the HTML. Keep every page under 100 KB (agents' page budget).
big=$(find "$DIST" -name '*.html' -size +100k | sed "s|^$DIST||" | head -5)
if [ -n "$big" ]; then echo "FAIL: pages over 100 KB:"; echo "$big"; fail=1; else echo "ok:   every page under 100 KB"; fi
# Organization: what assistants need to resolve who runs the site.
if python3 -c 'import json,re,sys; s=open(sys.argv[1]).read(); o=[n for b in re.findall(r"<script type=\"application/ld\+json\">(.*?)</script>",s,re.S) for n in (json.loads(b).get("@graph") or [json.loads(b)]) if n.get("@type")=="Organization" and n.get("description")]; sys.exit(0 if o and all(o[0].get(k) for k in ("name","url","logo","description","contactPoint")) and len(o[0].get("sameAs",[]))>=3 else 1)' "$DIST/index.html"; then echo "ok:   Organization has name, url, logo, description, contactPoint and 3+ sameAs"; else echo "FAIL: Organization JSON-LD incomplete"; fail=1; fi
[ -f "$DIST/404.html" ] && echo "ok:   404 page" || { echo "FAIL: 404 page missing"; fail=1; }
# External links must open in a new tab (keep visitors on the site).
same_tab=$(grep -rhoE '<a [^>]*href="https?://[^"]*"[^>]*>' "$DIST" --include=*.html | grep -v 'target="_blank"' | grep -v 'href="https://linuxstatistics.com' | sort -u | head -5 || true)
if [ -n "$same_tab" ]; then echo "FAIL: external links without target=\"_blank\":"; echo "$same_tab"; fail=1; else echo "ok:   external links open in a new tab"; fi
# Open data never carries third-party ranking data.
if grep -qiE 'rank_|hits_per_day|hitsPerDay|distrowatch|index_value' "$DIST/data/distros.json" "$DIST/data/distros.csv"; then echo "FAIL: open data carries ranking fields"; fail=1; else echo "ok:   open data has no ranking fields"; fi
# /lists/ carries ranks for the islands, so it is never offered as data.
if grep -qE 'href="[^"]*/lists/' "$DIST/data/index.html" || grep -q '/lists/' "$DIST/llms.txt" "$DIST/llms-full.txt" "$DIST/feed.xml"; then echo "FAIL: /lists/ is linked from the open data, llms.txt or the feed"; fail=1; else echo "ok:   /lists/ not offered as data"; fi
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
check distro/mint/index.html '<details class="key-facts key-facts-fold" open' "distro page has key facts, open in the HTML"
check "compare/$pair/index.html" 'key-facts-pair' "compare pair has key facts"
# llms-full.txt is an export: no rank numbers or hits.
if grep -qiE '#[0-9]|ranked|rank_|hits|interest score|index_value' "$DIST/llms-full.txt"; then echo "FAIL: llms-full.txt carries ranking data"; fail=1; else echo "ok:   llms-full.txt has no ranking data"; fi
check stats/index.html 'Linux by the numbers' "stats page renders"
# /stats is built from our totals: no rank numbers or hits.
if grep -qiE 'hitsPerDay|hits_per_day|interest score' "$DIST/stats/index.html"; then echo "FAIL: stats page carries ranking data"; fail=1; else echo "ok:   stats page has no ranking data"; fi
check articles/index.html 'Notes and analysis' "articles list renders"
check articles/feed.xml '<feed xmlns="http://www.w3.org/2005/Atom">' "articles feed is built"
check articles/data/index.html 'class="hub-start"' "article topic hub renders"
# Thin hubs (noindex) are never linked from other pages and stay out of the sitemap.
for f in "$DIST"/articles/*/index.html; do
  t=$(basename "$(dirname "$f")")
  grep -q 'class="hub-start"' "$f" || continue
  if grep -q 'name="robots" content="noindex"' "$f"; then
    # No match is the good case; grep exits 1 then, so don't let set -e stop the script.
    linked=$(grep -rl "href=\"/articles/$t/\"" "$DIST" --include=index.html 2>/dev/null | grep -v "^$DIST/articles/$t/index.html$" | head -3 || true)
    if [ -n "$linked" ]; then echo "FAIL: thin hub /articles/$t/ is linked from:"; echo "$linked"; fail=1; fi
    if grep -q "/articles/$t/<" "$DIST"/sitemap-*.xml; then echo "FAIL: thin hub /articles/$t/ is in the sitemap"; fail=1; fi
  fi
done
echo "ok:   thin article hubs unlinked and out of the sitemap"
# Article and hub pages point og:image at their own card, and the card is built; no chart line is left unrendered.
for f in "$DIST"/articles/*/index.html; do
  t=$(basename "$(dirname "$f")")
  if ! grep -q "property=\"og:image\" content=\"[^\"]*/articles/$t/og.png\"" "$f"; then echo "FAIL: /articles/$t/ has no own og:image"; fail=1; fi
  if [ ! -s "$DIST/articles/$t/og.png" ]; then echo "FAIL: /articles/$t/og.png is missing"; fail=1; fi
  if grep -q '\[chart:' "$f"; then echo "FAIL: /articles/$t/ has an unrendered [chart: ...] line"; fail=1; fi
done
echo "ok:   article share cards built, charts rendered"
# Guides: warn (don't fail) when steps were last checked more than 6 months ago.
if [ -f "$DIST/articles/guides.json" ]; then
  python3 - "$DIST/articles/guides.json" <<'PY' || true
import json,sys,datetime
now=datetime.date.today()
for g in json.load(open(sys.argv[1])):
    d=datetime.date.fromisoformat(g["checked"])
    if (now.year-d.year)*12+(now.month-d.month) > 6: print(f"WARN: guide /articles/{g['slug']}/ steps last checked {g['checked']}")
PY
fi
# Drafts never reach a production build.
if grep -rlqE 'article-draft-banner|article-draft-tag|Draft, not published' "$DIST/articles" 2>/dev/null; then echo "FAIL: a draft article is in the build"; fail=1; else echo "ok:   no draft articles in the build"; fi
echo "distro pages: $(ls "$DIST/distro" | wc -l | tr -d ' ')"
exit $fail
