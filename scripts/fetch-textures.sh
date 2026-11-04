#!/usr/bin/env bash
# Downloads photoreal planet textures from Solar System Scope (CC BY 4.0).
# https://www.solarsystemscope.com/textures/
set -uo pipefail

DEST="$(cd "$(dirname "$0")/.." && pwd)/apps/web/public/textures/planets"
BASE="https://www.solarsystemscope.com/textures/download"
mkdir -p "$DEST"

FILES=(
  2k_sun.jpg
  2k_mercury.jpg
  2k_venus_surface.jpg
  2k_earth_daymap.jpg
  2k_earth_nightmap.jpg
  2k_earth_clouds.jpg
  2k_mars.jpg
  2k_jupiter.jpg
  2k_saturn.jpg
  2k_saturn_ring_alpha.png
  2k_uranus.jpg
  2k_neptune.jpg
  2k_stars_milky_way.jpg
)

fail=0
for f in "${FILES[@]}"; do
  if [ -f "$DEST/$f" ]; then
    echo "exists  $f"
  elif curl -fsSL -o "$DEST/$f" "$BASE/$f"; then
    echo "fetched $f"
  else
    echo "FAILED  $f"
    rm -f "$DEST/$f"
    fail=1
  fi
done
[ "$fail" -eq 0 ] && echo "Done. Textures in $DEST" || { echo "Some downloads failed."; exit 1; }
