#!/usr/bin/env bash
# Standalone, path-independent static build of the playable demo (no Next router).
# Works from any URL/subpath (GitHub Pages, artifact hosting, file server). Usage: scripts/build-demo.sh [outdir]
set -euo pipefail
OUT="${1:-dist-demo}"
rm -rf "$OUT" && mkdir -p "$OUT"
grep -v '@fontsource' src/app/globals.css > src/tw-demo.css
pnpm exec tailwindcss -i src/tw-demo.css -o "$OUT/tw.css" --minify
rm -f src/tw-demo.css
pnpm exec esbuild scripts/demo-entry.tsx --bundle --minify --format=esm --target=es2020 \
  --outdir="$OUT" --loader:.woff2=file --loader:.woff=file --asset-names='[name]-[hash]' \
  --define:process.env.NODE_ENV='"production"' --log-level=warning
cp scripts/demo-index.html "$OUT/index.html"
cp public/icon.svg "$OUT/"
echo "Demo built in $OUT"
