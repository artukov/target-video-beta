#!/usr/bin/env bash
# Renders one region of FLASH.svg (canvas coordinates, in points) to a PNG with headless Chrome.
#   scripts/render-design.sh <frameX> <frameY> <width> <height> <out.png> [scale=2]
# A bare file name for <out.png> lands in design/. Home is "4150 25 390 1913".
set -euo pipefail

if [ $# -lt 5 ] || [ $# -gt 6 ]; then
  echo "usage: scripts/render-design.sh <frameX> <frameY> <width> <height> <out.png> [scale=2]" >&2
  exit 2
fi

x=$1 y=$2 w=$3 h=$4 out=$5 scale=${6:-2}
for n in "$x" "$y" "$w" "$h" "$scale"; do
  [[ $n =~ ^[0-9]+(\.[0-9]+)?$ ]] || { echo "not a positive number: $n" >&2; exit 2; }
done

root="$(cd "$(dirname "$0")/.." && pwd)"
svg="$root/FLASH.svg"
chrome="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
[ -f "$svg" ] || { echo "missing $svg" >&2; exit 1; }
[ -x "$chrome" ] || { echo "no Chrome at $chrome (set CHROME)" >&2; exit 1; }

mkdir -p "$root/design"
case "$out" in */*) ;; *) out="$root/design/$out" ;; esac

# The canvas size sits on the first line of the file; the rest is megabytes of base64.
canvas=$(head -n 1 "$svg" | sed -nE 's/.*<svg width="([0-9.]+)" height="([0-9.]+)".*/\1 \2/p')
[ -n "$canvas" ] || { echo "cannot read the canvas size from $svg" >&2; exit 1; }
read -r cw ch <<<"$canvas"

page="$root/design/.render-$$.html"
profile="$(mktemp -d)"
trap 'rm -rf "$page" "$profile"' EXIT

cat >"$page" <<EOF
<!doctype html>
<meta charset="utf-8">
<style>
  html, body { margin: 0; overflow: hidden; background: #fff; }
  #view { position: relative; width: ${w}px; height: ${h}px; overflow: hidden; }
  #view img { position: absolute; left: calc(-1 * ${x}px); top: calc(-1 * ${y}px); width: ${cw}px; height: ${ch}px; }
</style>
<div id="view"><img src="file://${svg// /%20}"></div>
EOF

rm -f "$out"
"$chrome" --headless=new --hide-scrollbars --disable-gpu --force-color-profile=srgb \
  --user-data-dir="$profile" --window-size="$w,$h" --force-device-scale-factor="$scale" \
  --virtual-time-budget=30000 --screenshot="$out" "file://${page// /%20}" >"$profile/chrome.log" 2>&1 || true

if [ ! -s "$out" ]; then
  tail -n 5 "$profile/chrome.log" | cut -c1-200 >&2
  echo "Chrome wrote no screenshot" >&2
  exit 1
fi

size=$(sips -g pixelWidth -g pixelHeight "$out" | awk '/pixel(Width|Height)/ { printf "%s%s", sep, $2; sep = "x" }')
want=$(awk -v w="$w" -v h="$h" -v s="$scale" 'BEGIN { printf "%dx%d", w * s + 0.5, h * s + 0.5 }')
echo "$out  $size px"
[ "$size" = "$want" ] || echo "warning: expected $want px" >&2
