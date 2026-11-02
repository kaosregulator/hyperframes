#!/bin/bash
# One-time prep: grades the room trailer, vendors GSAP, and makes the blurred
# backgrounds the card shots sit on. Needs ffmpeg and a Boared-games-beta checkout.
#   BOARED=/path/to/Boared-games-beta ./prepare.sh
set -e
cd "$(dirname "$0")"
BOARED=${BOARED:-../../../Boared-games-beta}
mkdir -p work stills/box
# The trailer is dark; lift it so it reads on a phone.
[ -f work/reel.mp4 ] || ffmpeg -v error -y -i "$BOARED/public/menu/reel.mp4" \
  -vf "eq=gamma=1.35:contrast=1.12:saturation=1.4:brightness=0.03" -c:v libx264 -crf 17 -preset fast -g 15 -an work/reel.mp4
# GSAP from the HyperFrames CLI's vendored copy (no CDN at render time).
[ -f work/gsap.min.js ] || cp ../../packages/cli/dist/vendor/npm/gsap@3.15.0/dist/gsap.min.js work/ 2>/dev/null \
  || curl -sSfL https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js -o work/gsap.min.js
for d in stills/*/; do [ "$d" = stills/box/ ] || gen/bg.sh "${d%/}"; done
for f in monopoly clue; do
  [ -f stills/box/$f-bg.jpg ] || ffmpeg -v error -y -i "$BOARED/public/cards/$f.jpg" \
    -vf "scale=-2:1920,crop=1080:1920,boxblur=40:3,eq=brightness=-0.28:saturation=1.3" stills/box/$f-bg.jpg
done
echo "ready: node gen/build.mjs specs/monopoly.json out/monopoly && (cd out/monopoly && npx hyperframes render)"
