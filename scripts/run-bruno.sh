#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPORT_DIR="$ROOT/tests/reports/bruno"
mkdir -p "$REPORT_DIR"

BRU=(npx bru)
if command -v bru >/dev/null 2>&1; then
  BRU=(bru)
fi

"${BRU[@]}" run "$ROOT/bruno/bachmain" \
  -r \
  --env "${BRUNO_ENV:-production}" \
  --reporter-json "$REPORT_DIR/bruno-results.json" \
  --reporter-html "$REPORT_DIR/index.html" \
  --reporter-skip-all-headers \
  || FAILED=1

# Native Bruno HTML is primary. Fallback converter keeps an HTML artifact if the CLI aborts early.
if [[ ! -f "$REPORT_DIR/index.html" ]]; then
  node "$ROOT/scripts/bruno-html-report.mjs" "$REPORT_DIR/bruno-results.json" "$REPORT_DIR/index.html" || true
fi
node "$ROOT/scripts/bruno-rate-limit.mjs" || true
exit "${FAILED:-0}"
