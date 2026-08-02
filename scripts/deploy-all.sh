#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
ORG="team_6Bs45GjLiuQAkKP5eE6fUOsf"
WEB_ID="prj_1IxdJq7c8Kamffare0gLAskdoD9k"
ADMIN_ID="prj_58uYNTn8uZNfSaNF53pg5mHkosf9"
CRM_ID="$(python3 -c "import json;print(json.load(open('.vercel/project.json'))['projectId'])" 2>/dev/null || echo 'prj_JDJO7v2dTvWBac2Gd0N7jX1ZdJjk')"

echo "==> Git push origin main"
git push origin main

echo "==> Vercel production redeploy (API)"
python3 scripts/vercel-redeploy.py --team "$ORG" --ref main \
  "crm:$CRM_ID" "admin:$ADMIN_ID" "web:$WEB_ID"

echo "Tamam. Kontrol: https://bachmain.com | https://uygulama.bachmain.com | https://yonetim.bachmain.com"
