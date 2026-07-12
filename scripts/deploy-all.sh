#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
ORG="team_6Bs45GjLiuQAkKP5eE6fUOsf"

echo "==> Git push origin main"
git push origin main

echo "==> Deploy bachmain (CRM)"
npx --yes vercel@latest --prod --yes

echo "==> Deploy bachmain-admin"
VERCEL_ORG_ID="$ORG" VERCEL_PROJECT_ID="prj_58uYNTn8uZNfSaNF53pg5mHkosf9" \
  npx --yes vercel@latest --prod --yes

echo "==> Deploy bachmain-web"
VERCEL_ORG_ID="$ORG" VERCEL_PROJECT_ID="prj_1IxdJq7c8Kamffare0gLAskdoD9k" \
  npx --yes vercel@latest --prod --yes

echo "Tamam. Kontrol: https://bachmain.com | https://uygulama.bachmain.com | https://yonetim.bachmain.com"
