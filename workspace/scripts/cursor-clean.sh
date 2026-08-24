#!/bin/bash
# Bachmain — Cursor kararlılık: önbellek temizliği (yeniden üretilebilir çıktılar)
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf apps/landing/.next apps/landing/out 2>/dev/null || true
echo "Temizlendi: apps/landing/.next, apps/landing/out"
echo "Cursor'u Reload Window yapın (Cmd+Shift+P → Developer: Reload Window)."
