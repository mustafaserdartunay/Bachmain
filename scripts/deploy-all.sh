#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Git push origin main"
git push origin main

echo "==> Vercel production redeploy (CLI)"
bash scripts/vercel-redeploy-cli.sh crm admin web || true

echo "Tamam. Kontrol: https://bachmain.com | https://uygulama.bachmain.com | https://yonetim.bachmain.com"
