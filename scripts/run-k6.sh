#!/usr/bin/env bash
# Run k6 load tiers and copy HTML/summary reports.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPORT_DIR="$ROOT/tests/reports/k6"
SCRIPT="$ROOT/tests/load/scenarios.js"
mkdir -p "$REPORT_DIR"

if ! command -v k6 >/dev/null 2>&1; then
  echo "k6 is not installed. Install: https://k6.io/docs/get-started/installation/"
  echo "Skipping load run; writing placeholder report."
  cat > "$REPORT_DIR/summary.html" <<'HTML'
<!doctype html><html><head><meta charset="utf-8"><title>k6 skipped</title></head>
<body><h1>k6 not installed</h1><p>Install k6 to generate load reports.</p></body></html>
HTML
  exit 0
fi

API_BASE="${API_BASE:-https://api.bachmain.com}"
WEB_BASE="${WEB_BASE:-https://bachmain.com}"
APP_BASE="${APP_BASE:-https://uygulama.bachmain.com}"
TIERS=(50 100 500 1000)

for vus in "${TIERS[@]}"; do
  echo "==> k6 ${vus} VUs"
  OUT="$REPORT_DIR/vus-${vus}"
  mkdir -p "$OUT"
  DURATION="${K6_DURATION:-1m}"
  if [[ "$vus" -ge 500 && -z "${K6_ALLOW_HEAVY:-}" ]]; then
    echo "Skipping ${vus} VUs (set K6_ALLOW_HEAVY=1 to enable heavy tiers)"
    continue
  fi
  k6 run \
    --env "VUS=$vus" \
    --env "DURATION=$DURATION" \
    --env "API_BASE=$API_BASE" \
    --env "WEB_BASE=$WEB_BASE" \
    --env "APP_BASE=$APP_BASE" \
    --summary-export "$OUT/summary.json" \
    --out "json=$OUT/raw.json" \
    "$SCRIPT" || {
      echo "k6 tier ${vus} failed" | tee "$OUT/FAILED.txt"
      FAILED=1
    }
  node "$ROOT/scripts/k6-html-report.mjs" "$OUT/summary.json" "$OUT/report.html" "$vus" || true
done

node "$ROOT/scripts/k6-html-report.mjs" --index "$REPORT_DIR" || true
exit "${FAILED:-0}"
