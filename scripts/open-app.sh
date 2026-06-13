#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-5173}"
URL="http://localhost:${PORT}/baglantilar.html"

if command -v open >/dev/null 2>&1; then
  open "$URL"
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$URL"
else
  echo "$URL"
fi
