#!/usr/bin/env bash
# Run every quality suite, preserve failures, and always create aggregate HTML.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
FAILED=0

run_suite() {
  local name="$1"
  shift
  echo "==> ${name}"
  "$@" || {
    echo "${name} failed"
    FAILED=1
  }
}

run_suite "Playwright" npm run test:e2e
run_suite "Bruno" npm run test:api
run_suite "Lighthouse" npm run test:lighthouse
run_suite "k6" npm run test:load

node scripts/aggregate-quality-report.mjs || FAILED=1
exit "$FAILED"
